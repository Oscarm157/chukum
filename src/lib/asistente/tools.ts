import type Anthropic from "@anthropic-ai/sdk";

/**
 * Herramientas del asistente. Las de tipo "cliente" no se ejecutan en el servidor:
 * se emiten al navegador, que las aplica sobre el estado de la tabla y devuelve el
 * resultado real en el siguiente turno (si pidió 15 keywords y existían 11, el modelo
 * se entera).
 */

export const TOOLS_CLIENTE = [
  "aplicar_filtros",
  "ordenar",
  "seleccionar_keywords",
  "navegar",
] as const;

export type ToolCliente = (typeof TOOLS_CLIENTE)[number];

export const esToolCliente = (nombre: string): nombre is ToolCliente =>
  (TOOLS_CLIENTE as readonly string[]).includes(nombre);

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "aplicar_filtros",
    description:
      "Filtra la tabla de keywords que Oscar está viendo. Solo manda los campos que quieras cambiar; los demás se quedan como están. Úsala cuando pida acotar por texto, por volumen o por competencia.",
    input_schema: {
      type: "object",
      properties: {
        busqueda: {
          type: "string",
          description: "Texto que debe contener la keyword. Cadena vacía para quitar el filtro.",
        },
        min_volumen: {
          type: "number",
          description: "Volumen mensual mínimo. 0 para quitar el filtro.",
        },
        competencias: {
          type: "array",
          items: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
          description: "Niveles de competencia a mostrar. Lista vacía para mostrar todos.",
        },
        solo_con_puja: {
          type: "boolean",
          description: "Solo keywords donde Google reporta puja.",
        },
      },
      required: [],
    },
  },
  {
    name: "ordenar",
    description: "Ordena la tabla de keywords por una columna.",
    input_schema: {
      type: "object",
      properties: {
        columna: {
          type: "string",
          enum: ["keyword", "plaza", "volumen", "competencia", "cpc"],
        },
        direccion: {
          type: "string",
          enum: ["asc", "desc"],
          description: "asc de menor a mayor, desc de mayor a menor.",
        },
      },
      required: ["columna", "direccion"],
    },
  },
  {
    name: "seleccionar_keywords",
    description:
      "Marca keywords en la tabla, por su texto exacto tal como aparece. Es lo que usas cuando Oscar pide 'selecciona las mejores' o 'quédate con estas'. La selección alimenta la calculadora y es lo que se puede mandar a un grupo.",
    input_schema: {
      type: "object",
      properties: {
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Texto exacto de cada keyword a marcar.",
        },
        reemplazar: {
          type: "boolean",
          description: "true (default) limpia la selección previa; false suma a lo ya marcado.",
        },
      },
      required: ["keywords"],
    },
  },
  {
    name: "navegar",
    description: "Lleva a Oscar a otra pantalla del panel de pauta.",
    input_schema: {
      type: "object",
      properties: {
        destino: {
          type: "string",
          enum: ["keywords", "grupos"],
        },
        plaza: {
          type: "string",
          description: "Solo para destino keywords: filtra por esa plaza (ej. Tulum, Merida).",
        },
        mercado: {
          type: "string",
          enum: ["nacional_es", "extranjero_en"],
          description: "Solo para destino keywords.",
        },
      },
      required: ["destino"],
    },
  },
  {
    name: "consultar_mercado",
    description:
      "Consulta los datos medidos que no están en pantalla: todas las plazas con su volumen nacional y extranjero, CPC y competencia, y los grupos ya armados con sus métricas. Úsala cuando la pregunta sea de estrategia (dónde entrar, con qué presupuesto) y necesites comparar plazas que Oscar no está viendo.",
    input_schema: {
      type: "object",
      properties: {
        que: {
          type: "string",
          enum: ["plazas", "grupos", "ambos"],
        },
      },
      required: ["que"],
    },
  },
  {
    name: "proponer_grupo",
    description:
      "Propone crear un grupo de anuncios con las keywords seleccionadas. NO lo guarda: Oscar ve una tarjeta y decide. Un grupo es de una sola ciudad y un solo tema.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string", description: "Ej. 'Mérida · Terrenos'." },
        plaza: { type: "string" },
        tema: {
          type: "string",
          enum: ["terrenos", "casas", "departamentos", "otro"],
        },
        mercado: { type: "string", enum: ["nacional_es", "extranjero_en"] },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Texto exacto de las keywords que van en el grupo.",
        },
        porque: {
          type: "string",
          description: "Una línea sobre por qué estas keywords juntas.",
        },
      },
      required: ["nombre", "plaza", "tema", "mercado", "keywords"],
    },
  },
  {
    type: "web_search_20260209",
    name: "web_search",
    max_uses: 4,
  } as unknown as Anthropic.Tool,
];
