import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import matter from "gray-matter";
import { KB_COOKIE, expectedToken, constantTimeEqual } from "@/lib/campus-gate";

// Logica compartida por los dos route handlers de "Agregar video":
// - candado del gate (misma cookie sha256 que el proxy),
// - prompt de IA que convierte el transcript crudo en ficha,
// - calculo de la ruta del .md (carpeta por tema, correlativo, slug).

export const CAMPUS_REPO = "Oscarm157/grupo-orve";
export const CAMPUS_BRANCH = "main";
const CONTENT_ROOT = path.join(process.cwd(), "content", "campus");

/** Verifica la cookie del gate contra el sha256 de KB_PASSWORD. Candado del gasto
 *  de IA y del write al repo: sin cookie valida, ni se llama a la API ni se escribe. */
export async function campusGateOk(): Promise<boolean> {
  const [jar, expected] = await Promise.all([cookies(), expectedToken()]);
  const cookie = jar.get(KB_COOKIE)?.value;
  return Boolean(expected && cookie && constantTimeEqual(cookie, expected));
}

function deburr(input: string): string {
  return input.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function slugify(input: string): string {
  return deburr(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Nombre de carpeta del tema. Reusa la carpeta existente si ya hay una que
 *  coincide sin acentos/mayusculas (p. ej. tema "Inducción" -> carpeta "Induccion");
 *  si el tema es nuevo, la carpeta es el tema sin diacriticos. */
export function folderForTema(tema: string): string {
  const target = deburr(tema).toLowerCase().trim();
  if (fs.existsSync(CONTENT_ROOT)) {
    for (const entry of fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })) {
      if (entry.isDirectory() && deburr(entry.name).toLowerCase() === target) {
        return entry.name;
      }
    }
  }
  return deburr(tema).trim().replace(/\s+/g, "-");
}

/** Correlativo local (best-effort) para el preview del paso de procesar. El numero
 *  autoritativo se recalcula contra GitHub al guardar. */
export function localNextNumber(tema: string): number {
  const folder = folderForTema(tema);
  const dir = path.join(CONTENT_ROOT, folder);
  if (!fs.existsSync(dir)) return 1;
  let max = 0;
  for (const entry of fs.readdirSync(dir)) {
    if (!entry.endsWith(".md")) continue;
    const raw = fs.readFileSync(path.join(dir, entry), "utf8");
    const { data } = matter(raw);
    const n = Number(data.video);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return max + 1;
}

/** Lee `tema` y `title` del frontmatter de un markdown de ficha. */
export function readFichaMeta(markdown: string): { tema: string; title: string } {
  const { data } = matter(markdown);
  return {
    tema: String(data.tema ?? "").trim(),
    title: String(data.title ?? "").trim(),
  };
}

/** Reescribe `video:` en el frontmatter y el `# NN ·` del titulo con el numero dado,
 *  para que el contenido sea consistente con el nombre de archivo. */
export function applyNumber(markdown: string, num: number): string {
  const nn = String(num).padStart(2, "0");
  let out = markdown;

  if (/^video:\s*.*$/m.test(out)) {
    out = out.replace(/^video:\s*.*$/m, `video: ${num}`);
  }

  if (/^#\s+\d+\s*·\s*/m.test(out)) {
    out = out.replace(/^#\s+\d+\s*·\s*/m, `# ${nn} · `);
  } else {
    // Titulo sin prefijo NN: se lo anteponemos.
    out = out.replace(/^#\s+(.*)$/m, `# ${nn} · $1`);
  }

  return out;
}

/** Ruta del .md dentro del repo: content/campus/<carpeta>/<NN>-<slug>.md */
export function fichaPath(tema: string, title: string, num: number): string {
  const folder = folderForTema(tema);
  const nn = String(num).padStart(2, "0");
  const slug = slugify(title) || "ficha";
  return `content/campus/${folder}/${nn}-${slug}.md`;
}

// System prompt de la IA. Encoda formato exacto, normalizaciones y anti-slop.
export const AI_SYSTEM_PROMPT = `Eres editor de la base de conocimientos interna Campus Chukum de Chukum, una desarrolladora inmobiliaria mexicana. Recibes el transcript crudo de un video de capacitacion y lo conviertes en una ficha de estudio en un formato fijo. Respondes SOLO con el markdown de la ficha, sin texto antes ni despues, sin bloques de codigo.

FORMATO EXACTO (respetalo al caracter, incluidos los encabezados y el orden):
---
video: <numero entero>
title: <titulo corto y factual del video>
tema: <un tema: Inducción, Empresa, Producto, Ventas, Medios, Cultura u otro que encaje>
duracion: "<m:ss>"
tipo: <Bienvenida, Institucional, Cultura, Entrevista, Producto, Proceso u otro que encaje>
tags: [campus-chukum, <2 a 4 tags mas en minusculas, sin acentos, con guiones>]
---
# <NN> · <titulo>

## Resumen
<2 a 4 lineas, factual, que dice el video sin adornos>

## Datos clave
- <viñetas con cifras, fechas, nombres propios y datos concretos tal como aparecen en el video>

## Puntos a recordar
- <lo esencial que el colaborador debe retener>

## Posibles preguntas de evaluación
- ¿<pregunta>? → <respuesta breve>.

REGLAS DE NORMALIZACION (aplicalas siempre, es transcripcion con errores de dictado):
- "Orbe" y variantes fonéticas del nombre de la empresa → "Chukum".
- "Ucana" → "Ukana".
- "Sania" o "Zania" → "Zania".
- "Kenoa" → "Kenúa".
- Corrige nombres propios mal transcritos cuando el contexto lo deja claro; no inventes datos que no estén en el transcript.

REGLAS DE CONTENIDO (anti-slop, obligatorias):
- Español. Tono factual y concreto, como apuntes de estudio, no como copy de marketing.
- NO repitas el humo del guion: nada de "transformar sueños", "la mejor versión de ti", "innovación constante", "sin límites", "familia Chukum" como relleno. Si el video dice una frase de marca literal y vale como cita, ponla entre comillas y marcala como frase/cierre, no como dato.
- Captura cifras y nombres tal cual (años de experiencia, m², número de oficinas, colaboradores, proyectos, montos). Si un número no está en el transcript, no lo pongas.
- Prohibido usar em-dashes (—). Usa comas, dos puntos o punto.
- Si el usuario da título o tema, respétalos. Si no, infiérelos del contenido.
- Infiere el tipo por el contenido.
- Duración: si el transcript trae timestamps, usa el último como duración en formato m:ss. Si no hay timestamps, estima por la extensión y usa un valor plausible.
- El campo video puede ir en 1; el sistema lo renumera al guardar.`;
