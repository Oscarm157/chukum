import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { interpretarYGenerarBorrador } from "@/lib/contenido-agente/loop";

export const runtime = "nodejs";
export const maxDuration = 60; // el loop del agente puede tomar varios turnos con Claude.

const bodySchema = z.object({
  mensaje: z.string().trim().min(3).max(500),
});

// Contraparte en el panel del webhook de Telegram: aquí SÍ hay navegador y sesión de
// cookie, así que el guard es la sesión de admin real (más estricto que un anti-bot; mismo
// criterio que ya usa `/api/asistente`, otro endpoint de IA solo para admin logueado).
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Falta ANTHROPIC_API_KEY." }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  const resultado = await interpretarYGenerarBorrador({ mensaje: parsed.data.mensaje, userId: me.id });
  return NextResponse.json(resultado);
}
