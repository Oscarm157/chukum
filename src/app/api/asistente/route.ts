import Anthropic from "@anthropic-ai/sdk";
import { checkBotId } from "botid/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/session";
import { getGrupos, getPlazas } from "@/lib/keywords-data";
import { SYSTEM_ASISTENTE } from "@/lib/asistente/prompt";
import { TOOLS, esToolCliente } from "@/lib/asistente/tools";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MENSAJES = 24;
const MAX_CHARS = 6000;

const bodySchema = z.object({
  // El historial va en formato Anthropic: el cliente conserva los bloques tal cual
  // los devolvimos, para que los tool_use y sus tool_result queden emparejados.
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.unknown() })).min(1),
  contexto: z
    .object({
      pantalla: z.string().max(40),
      plaza: z.string().max(80).optional(),
      mercado: z.string().max(20).optional(),
      visibles: z.number().int().min(0),
      seleccionadas: z.number().int().min(0),
      muestra: z
        .array(
          z.object({
            keyword: z.string(),
            volumen: z.number(),
            cpc: z.number(),
            competencia: z.string(),
            plaza: z.string(),
            mercado: z.string(),
          }),
        )
        .max(80),
    })
    .optional(),
});

/** Lo que el modelo ve de la pantalla. Va al final: cambia en cada turno y rompería el caché. */
function describeContexto(c: NonNullable<z.infer<typeof bodySchema>["contexto"]>) {
  const filtro = [c.plaza && `plaza ${c.plaza}`, c.mercado && `mercado ${c.mercado}`]
    .filter(Boolean)
    .join(", ");
  const tabla = c.muestra
    .map(
      (k) =>
        `${k.keyword} | ${k.plaza} | ${k.mercado === "nacional_es" ? "MX" : "US"} | ${k.volumen} | ${k.competencia} | $${k.cpc.toFixed(2)}`,
    )
    .join("\n");
  return `<estado_pantalla>
Pantalla: ${c.pantalla}${filtro ? ` (${filtro})` : ""}
Keywords a la vista: ${c.visibles}. Seleccionadas: ${c.seleccionadas}.

Las que está viendo (keyword | plaza | mercado | vol/mes | competencia | puja alta USD):
${tabla || "(ninguna)"}
</estado_pantalla>`;
}

export async function POST(req: Request) {
  const inicio = Date.now();

  const me = await getCurrentUser();
  if (!me || me.role !== "admin") {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  // Llamada cara: filtra bots. BotID solo corre desplegado en Vercel; en local
  // lanza "Must be deployed on Vercel", así que ahí se salta.
  if (process.env.VERCEL) {
    const verificacion = await checkBotId();
    if (verificacion.isBot) {
      return Response.json({ error: "Bloqueado." }, { status: 403 });
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Falta ANTHROPIC_API_KEY." }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Petición inválida." }, { status: 400 });
  }

  const { messages, contexto } = parsed.data;
  const recortados = messages.slice(-MAX_MENSAJES);
  const pesaDemasiado = JSON.stringify(recortados).length > MAX_CHARS * MAX_MENSAJES;
  if (pesaDemasiado) {
    return Response.json({ error: "La conversación es muy larga." }, { status: 413 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        const mensajes = [
          ...(recortados as Anthropic.MessageParam[]),
          ...(contexto
            ? [{ role: "user" as const, content: describeContexto(contexto) }]
            : []),
        ];

        const llamada = anthropic.messages.stream({
          model: "claude-opus-4-8",
          max_tokens: 8000,
          // Esfuerzo bajo: casi todo son acciones de pantalla o aritmética sobre datos
          // que ya van en el prompt. Pensar más solo agregaba espera.
          thinking: { type: "adaptive", display: "summarized" },
          output_config: { effort: "low" },
          // El prompt estable va primero y cacheado; el estado de pantalla queda después.
          system: [
            { type: "text", text: SYSTEM_ASISTENTE, cache_control: { type: "ephemeral" } },
          ],
          tools: TOOLS,
          messages: mensajes,
        });

        for await (const evento of llamada) {
          if (evento.type !== "content_block_delta") continue;
          if (evento.delta.type === "text_delta") {
            emit({ type: "texto", texto: evento.delta.text });
          } else if (evento.delta.type === "thinking_delta") {
            // Se muestra mientras razona: así se ve el avance y no un "pensando"
            // mudo de medio minuto.
            emit({ type: "pensamiento", texto: evento.delta.thinking });
          }
        }

        const final = await llamada.finalMessage();

        // Las herramientas de pantalla las ejecuta el navegador; las de datos, aquí.
        const resultadosServidor: Anthropic.ToolResultBlockParam[] = [];
        for (const bloque of final.content) {
          if (bloque.type !== "tool_use") continue;
          if (esToolCliente(bloque.name)) {
            emit({ type: "accion", id: bloque.id, nombre: bloque.name, input: bloque.input });
          } else if (bloque.name === "proponer_grupo") {
            emit({ type: "propuesta", id: bloque.id, input: bloque.input });
          } else if (bloque.name === "consultar_mercado") {
            const que = (bloque.input as { que?: string }).que ?? "ambos";
            const datos: Record<string, unknown> = {};
            if (que === "plazas" || que === "ambos") datos.plazas = await getPlazas();
            if (que === "grupos" || que === "ambos") datos.grupos = await getGrupos();
            resultadosServidor.push({
              type: "tool_result",
              tool_use_id: bloque.id,
              content: JSON.stringify(datos),
            });
          }
        }

        emit({
          type: "fin",
          mensaje: final.content,
          stop: final.stop_reason,
          resultadosServidor,
        });

        console.info(
          JSON.stringify({
            evento: "asistente",
            usuario: me.id,
            ms: Date.now() - inicio,
            entrada: final.usage.input_tokens,
            cache_lectura: final.usage.cache_read_input_tokens ?? 0,
            salida: final.usage.output_tokens,
            tools: final.content.filter((b) => b.type === "tool_use").map((b) => b.name),
          }),
        );
      } catch (err) {
        console.error(
          JSON.stringify({
            evento: "asistente_error",
            usuario: me.id,
            error: err instanceof Error ? err.message : String(err),
          }),
        );
        emit({ type: "error", mensaje: "No se pudo completar la respuesta." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Sin esto el proxy puede acumular el stream y entregarlo al final: se ve
      // "Pensando" durante todo el turno aunque el modelo ya esté escribiendo.
      "X-Accel-Buffering": "no",
    },
  });
}
