// Loop de tool-use del agente de contenido. A diferencia del Asistente CRM
// (`src/app/api/asistente/route.ts`), aquí el multi-turno vive DENTRO del servidor: Telegram
// no tiene navegador que rebote el historial, así que este módulo corre un `for` acotado y
// llama a Claude sin streaming hasta resolver o agotar los turnos.

import Anthropic from "@anthropic-ai/sdk";
import { eq, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { developments, socialPosts } from "@/lib/schema";
import { generarBorradorInterno } from "@/app/admin/(panel)/contenido/actions";
import { SYSTEM_AGENTE_CONTENIDO } from "./prompt";
import { TOOLS } from "./tools";

const MAX_TURNOS = 6;

export type ResultadoAgente =
  | { tipo: "post_creado"; postId: string; caption: string; imageUrl: string }
  | { tipo: "mensaje"; texto: string };

async function buscarDesarrollo(nombre: string): Promise<{ id: string; name: string }[]> {
  if (!nombre.trim()) return [];
  return db
    .select({ id: developments.id, name: developments.name })
    .from(developments)
    .where(ilike(developments.name, `%${nombre.trim()}%`))
    .limit(5);
}

// Nunca se confía en el development_id que "dijo" el modelo: se verifica contra la DB antes
// de usarlo, mismo criterio que ya aplica el resto del módulo con ids que manda el cliente.
async function ejecutarCrearBorrador(
  input: Record<string, unknown>,
  userId: string
): Promise<{ ok: true; id: string; caption: string; imageUrl: string } | { ok: false; error: string }> {
  const developmentId = typeof input.development_id === "string" ? input.development_id : "";
  const angulo = typeof input.angulo === "string" && input.angulo.trim() ? input.angulo.trim() : undefined;

  if (!developmentId) return { ok: false, error: "Falta development_id: usa buscar_desarrollo primero." };
  const existe = await db.select({ id: developments.id }).from(developments).where(eq(developments.id, developmentId));
  if (!existe[0]) return { ok: false, error: "Ese development_id no existe. Vuelve a llamar buscar_desarrollo." };

  const resultado = await generarBorradorInterno({ sourceType: "desarrollo", developmentId, angulo }, userId);
  if ("error" in resultado) return { ok: false, error: resultado.error };

  const filas = await db.select().from(socialPosts).where(eq(socialPosts.id, resultado.id));
  const post = filas[0];
  if (!post) return { ok: false, error: "El post se generó pero no se pudo releer de la base." };

  return { ok: true, id: post.id, caption: post.caption, imageUrl: post.imageUrl };
}

export async function interpretarYGenerarBorrador({
  mensaje,
  userId,
}: {
  mensaje: string;
  userId: string;
}): Promise<ResultadoAgente> {
  const inicio = Date.now();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: mensaje }];

  let resultado: ResultadoAgente | null = null;
  let entrada = 0;
  let salida = 0;
  const herramientas = new Set<string>();
  let turno = 0;

  for (; turno < MAX_TURNOS; turno++) {
    const resp = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      // Esfuerzo bajo: resolver un desarrollo y armar un borrador no necesita razonar de más.
      output_config: { effort: "low" },
      system: SYSTEM_AGENTE_CONTENIDO,
      tools: TOOLS,
      messages,
    });
    entrada += resp.usage.input_tokens;
    salida += resp.usage.output_tokens;

    const toolUses = resp.content.filter((b) => b.type === "tool_use");
    if (toolUses.length === 0) {
      const texto = resp.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      resultado = { tipo: "mensaje", texto: texto || "No entendí bien, ¿puedes darme más detalle?" };
      break;
    }

    messages.push({ role: "assistant", content: resp.content });
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const tu of toolUses) {
      herramientas.add(tu.name);
      if (tu.name === "buscar_desarrollo") {
        const nombre = typeof (tu.input as Record<string, unknown>).nombre === "string" ? (tu.input as { nombre: string }).nombre : "";
        const matches = await buscarDesarrollo(nombre);
        toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(matches) });
      } else if (tu.name === "crear_borrador") {
        const r = await ejecutarCrearBorrador(tu.input as Record<string, unknown>, userId);
        toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(r) });
        // Si falla (id inválido, sin fotos, etc.), el loop sigue: el modelo ve el error en
        // el tool_result y puede reintentar buscar_desarrollo o preguntar.
        if (r.ok) resultado = { tipo: "post_creado", postId: r.id, caption: r.caption, imageUrl: r.imageUrl };
      }
    }

    if (resultado) break;
    messages.push({ role: "user", content: toolResults });
  }

  if (!resultado) {
    resultado = { tipo: "mensaje", texto: "No pude resolverlo en varios intentos. Intenta ser más específico o usa el panel." };
  }

  console.info(
    JSON.stringify({
      evento: "contenido_agente",
      usuario: userId,
      ms: Date.now() - inicio,
      turnos: turno + 1,
      resultado: resultado.tipo,
      entrada,
      salida,
      herramientas: [...herramientas],
    })
  );

  return resultado;
}
