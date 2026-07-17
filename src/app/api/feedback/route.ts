import { and, eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { feedbackLinks, feedbackNotes } from "@/lib/schema";
import { makeRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Rate limit por IP (best-effort, por instancia serverless). Mismo patrón que /api/leads.
const rateLimited = makeRateLimiter(60_000, 40);

const cap = (v: unknown, n: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, n) : null;
};

const clampPct = (v: unknown): number | null => {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
};

const clampInt = (v: unknown, max: number): number | null => {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(max, Math.round(n)));
};

async function activeLink(token: string | null) {
  if (!token) return null;
  const rows = await db
    .select({ id: feedbackLinks.id, label: feedbackLinks.label })
    .from(feedbackLinks)
    .where(and(eq(feedbackLinks.token, token), eq(feedbackLinks.active, true)))
    .limit(1);
  return rows[0] ?? null;
}

// GET: valida el token y, si trae path, devuelve los pines ya dejados en esa página.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = cap(url.searchParams.get("token"), 200);
  const path = cap(url.searchParams.get("path"), 500);
  const link = await activeLink(token);
  if (!link) {
    return Response.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }
  let notes: unknown[] = [];
  if (path) {
    notes = await db
      .select({
        id: feedbackNotes.id,
        note: feedbackNotes.note,
        xPct: feedbackNotes.xPct,
        yPct: feedbackNotes.yPct,
        status: feedbackNotes.status,
      })
      .from(feedbackNotes)
      .where(and(eq(feedbackNotes.linkId, link.id), eq(feedbackNotes.path, path)))
      .orderBy(desc(feedbackNotes.createdAt));
  }
  // Total en todo el sitio (todas las páginas) para el contador del widget.
  const all = await db
    .select({ id: feedbackNotes.id })
    .from(feedbackNotes)
    .where(eq(feedbackNotes.linkId, link.id));
  return Response.json({ ok: true, label: link.label, notes, total: all.length });
}

// POST: guarda una nota anónima ligada a un token activo.
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const token = cap(body.token, 200);
  const link = await activeLink(token);
  if (!link) {
    return Response.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }

  const note = cap(body.note, 2000);
  const path = cap(body.path, 500);
  if (!note || !path) {
    return Response.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const inserted = await db
    .insert(feedbackNotes)
    .values({
      linkId: link.id,
      path,
      note,
      selector: cap(body.selector, 500),
      elementText: cap(body.elementText, 300),
      xPct: clampPct(body.xPct),
      yPct: clampPct(body.yPct),
      viewportW: clampInt(body.viewportW, 10000),
      pageTitle: cap(body.pageTitle, 300),
    })
    .returning({ id: feedbackNotes.id });

  return Response.json({ ok: true, id: inserted[0]?.id });
}
