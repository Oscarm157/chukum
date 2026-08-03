import type Anthropic from "@anthropic-ai/sdk";

/**
 * Herramientas del agente de contenido: resolver a qué desarrollo se refiere el usuario
 * y, ya resuelto, generar el borrador. Ambas corren en el servidor (no hay cliente/navegador
 * en Telegram): a diferencia de `asistente/tools.ts`, aquí no hay tools "de cliente".
 */

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "buscar_desarrollo",
    description:
      "Busca un desarrollo del catálogo de Chukum por nombre o parte del nombre. Úsala para resolver a qué desarrollo se refiere el usuario ANTES de crear_borrador. Devuelve los que coincidan (puede ser ninguno, uno o varios).",
    input_schema: {
      type: "object",
      properties: {
        nombre: {
          type: "string",
          description: "Nombre o parte del nombre tal como lo escribió/dijo el usuario.",
        },
      },
      required: ["nombre"],
    },
  },
  {
    name: "crear_borrador",
    description:
      "Genera un borrador de post (nunca lo publica) para un desarrollo específico ya resuelto con buscar_desarrollo, con un ángulo/enfoque opcional.",
    input_schema: {
      type: "object",
      properties: {
        development_id: {
          type: "string",
          description: "Id exacto devuelto por buscar_desarrollo. Nunca inventes uno.",
        },
        angulo: {
          type: "string",
          description:
            "Enfoque/audiencia pedida por el usuario, en sus palabras (ej. 'dirigido a expats mayores de 60 años, énfasis en plusvalía'). Opcional, omite si no se pidió nada específico.",
        },
      },
      required: ["development_id"],
    },
  },
];
