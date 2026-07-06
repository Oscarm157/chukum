import { z } from "zod";
import { Resend } from "resend";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, type LeadSource } from "@/lib/schema";

export const runtime = "nodejs";

const leadRecipient = process.env.LEAD_RECIPIENT || process.env.EMAIL_FROM || "";
const mailFrom = process.env.EMAIL_FROM || "onboarding@resend.dev";

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Best-effort per-IP rate limit (por instancia serverless).
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  if (recent.length === 0) hits.delete(ip);
  else hits.set(ip, recent);
  return recent.length > RATE_MAX;
}

const schema = z.object({
  name: z.string().max(200).optional(),
  email: z.string().max(200).optional(),
  phone: z.string().max(60).optional(),
  message: z.string().max(2000).optional(),
  locale: z.string().optional(),
  source: z.string().optional(),
  sourceUrl: z.string().max(500).optional(),
  zonaSlug: z.string().max(200).optional(),
  developmentSlug: z.string().max(200).optional(),
  utmSource: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
});

const clean = (v?: string): string | null => {
  const t = v?.trim();
  return t ? t : null;
};

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const d = parsed.data;
  const name = clean(d.name);
  const email = clean(d.email);
  const phone = clean(d.phone);
  const message = clean(d.message);
  // Un lead sin forma de contactar no sirve.
  if (!email && !phone) {
    return Response.json({ ok: false, error: "missing_contact" }, { status: 400 });
  }

  const locale = d.locale === "en" ? "en" : "es";
  const source: LeadSource = d.source === "whatsapp" || d.source === "manual" ? d.source : "form";

  // Descarta doble-submit: mismo email en los últimos 10 min.
  if (email) {
    const recent = await db
      .select({ id: leads.id })
      .from(leads)
      .where(and(eq(leads.email, email), gt(leads.createdAt, new Date(Date.now() - 10 * 60 * 1000))))
      .limit(1);
    if (recent.length) return Response.json({ ok: true });
  }

  let hadError = false;
  try {
    await db.insert(leads).values({
      name,
      email,
      phone,
      message,
      locale,
      source,
      sourceUrl: clean(d.sourceUrl),
      zonaSlug: clean(d.zonaSlug),
      developmentSlug: clean(d.developmentSlug),
      utmSource: clean(d.utmSource),
      utmCampaign: clean(d.utmCampaign),
      utmMedium: clean(d.utmMedium),
    });
  } catch (err) {
    console.error("lead: DB insert failed", err);
    hadError = true;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: mailFrom,
      to: leadRecipient,
      subject: `Nuevo lead (${source}): ${name ?? "Sin nombre"} (${locale.toUpperCase()})`,
      html: `
        <h2 style="margin:0 0 16px;font-family:sans-serif">Nuevo lead (${esc(source)})</h2>
        <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
          <tr><td style="padding:4px 12px 4px 0;color:#888">Nombre</td><td><strong>${esc(name ?? "N/D")}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888">Email</td><td>${esc(email ?? "N/D")}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888">Teléfono</td><td>${esc(phone ?? "N/D")}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888">Mensaje</td><td>${esc(message ?? "N/D")}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888">Zona</td><td>${esc(clean(d.zonaSlug) ?? "N/D")}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888">Desarrollo</td><td>${esc(clean(d.developmentSlug) ?? "N/D")}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#888">Origen</td><td>${esc(clean(d.sourceUrl) ?? "N/D")}</td></tr>
        </table>
      `.trim(),
    });
  } catch (err) {
    console.error("lead: email failed", err);
    hadError = true;
  }

  if (hadError) return Response.json({ ok: false }, { status: 207 });
  return Response.json({ ok: true });
}
