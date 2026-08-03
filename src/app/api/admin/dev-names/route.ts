import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { developments } from "@/lib/schema";

export const runtime = "nodejs";

// Nombre real de cada desarrollo (Xo'ok, Ciudad Central, etc.), solo para que Oscar los
// ubique rápido mientras navega el sitio público logueado como admin. El nombre comercial
// tiene restricción legal de publicidad (ver schema.ts): nunca debe llegar al HTML/bundle
// que recibe un visitante sin sesión, así que este endpoint responde 401 fuera de esa sesión.
export async function GET() {
  const u = await getCurrentUser();
  if (!u || u.role !== "admin") {
    return NextResponse.json({}, { status: 401 });
  }
  const rows = await db.select({ slug: developments.slug, name: developments.name }).from(developments);
  return NextResponse.json(Object.fromEntries(rows.map((r) => [r.slug, r.name])));
}
