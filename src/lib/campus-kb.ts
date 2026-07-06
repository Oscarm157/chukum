import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

// El markdown es la fuente de verdad. Las fichas viven en carpetas por tema dentro
// de content/campus (p. ej. content/campus/Induccion/01-campus-orve.md). Agregar una
// ficha = agregar un .md dentro de una carpeta de tema. El sitio las toma solo.

const CONTENT_ROOT = path.join(process.cwd(), "content", "campus");

export type QA = { question: string; answer: string };

export type Section = {
  heading: string;
  /** cuerpo markdown crudo de la seccion (sin el heading) */
  body: string;
};

export type Ficha = {
  slug: string;
  video: number;
  title: string;
  tema: string;
  temaSlug: string;
  duracion: string;
  tipo: string;
  tags: string[];
  /** primer parrafo del Resumen, para la tarjeta del indice */
  excerpt: string;
  /** texto plano concatenado, para el buscador client */
  searchText: string;
  sections: Section[];
};

export type TemaGroup = {
  tema: string;
  temaSlug: string;
  fichas: Ficha[];
};

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Divide el cuerpo markdown (sin frontmatter) en secciones por encabezado `## `. */
function splitSections(body: string): Section[] {
  const lines = body.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)$/);
    const h1 = line.match(/^#\s+(.*)$/);
    if (h1) continue; // el titulo H1 lo mostramos aparte
    if (h2) {
      if (current) sections.push(current);
      current = { heading: h2[1].trim(), body: "" };
      continue;
    }
    if (current) current.body += line + "\n";
  }
  if (current) sections.push(current);

  return sections.map((s) => ({ heading: s.heading, body: s.body.trim() }));
}

/** Parsea items `- pregunta → respuesta` en pares Q/A. */
export function parseQA(body: string): QA[] {
  const out: QA[] = [];
  for (const raw of body.split("\n")) {
    const line = raw.replace(/^[-*]\s+/, "").trim();
    if (!line) continue;
    const arrow = line.indexOf("→");
    if (arrow === -1) continue;
    const question = line.slice(0, arrow).trim();
    const answer = line.slice(arrow + 1).trim();
    if (question) out.push({ question, answer });
  }
  return out;
}

function firstParagraph(body: string): string {
  const trimmed = body.trim();
  const end = trimmed.indexOf("\n\n");
  const para = (end === -1 ? trimmed : trimmed.slice(0, end)).replace(/\s+/g, " ").trim();
  return para;
}

function readFicha(filePath: string, temaFallback: string): Ficha | null {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  if (data.video === undefined || data.video === null) return null; // no es una ficha

  const tema = String(data.tema ?? temaFallback);
  const temaSlug = slugify(tema);
  const fileBase = path.basename(filePath, ".md");
  const slug = `${temaSlug}-${slugify(fileBase)}`;

  const sections = splitSections(content);
  const resumen = sections.find((s) => s.heading.toLowerCase() === "resumen");
  const excerpt = resumen ? firstParagraph(resumen.body) : firstParagraph(content);

  const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
  const title = String(data.title ?? fileBase);

  return {
    slug,
    video: Number(data.video),
    title,
    tema,
    temaSlug,
    duracion: String(data.duracion ?? ""),
    tipo: String(data.tipo ?? ""),
    tags,
    excerpt,
    searchText: [title, tema, data.tipo, tags.join(" "), content]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
    sections,
  };
}

/** Recorre recursivamente una carpeta de tema y devuelve sus fichas .md. */
function readTemaDir(dir: string, tema: string): Ficha[] {
  const fichas: Ficha[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fichas.push(...readTemaDir(full, tema));
    } else if (entry.isFile() && entry.name.endsWith(".md") && entry.name.toLowerCase() !== "index.md") {
      const ficha = readFicha(full, tema);
      if (ficha) fichas.push(ficha);
    }
  }
  return fichas;
}

let cache: TemaGroup[] | null = null;

/** Todas las fichas agrupadas por tema, ordenadas. */
export function getTemas(): TemaGroup[] {
  if (cache) return cache;

  const byTema = new Map<string, Ficha[]>();
  if (fs.existsSync(CONTENT_ROOT)) {
    for (const entry of fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      const fichas = readTemaDir(path.join(CONTENT_ROOT, entry.name), entry.name);
      for (const ficha of fichas) {
        const list = byTema.get(ficha.tema) ?? [];
        list.push(ficha);
        byTema.set(ficha.tema, list);
      }
    }
  }

  const groups: TemaGroup[] = [...byTema.entries()]
    .map(([tema, fichas]) => ({
      tema,
      temaSlug: slugify(tema),
      fichas: fichas.sort((a, b) => a.video - b.video),
    }))
    .sort((a, b) => {
      // Ordena por el numero de video mas bajo del tema (mantiene "Induccion" al frente).
      const minA = Math.min(...a.fichas.map((f) => f.video));
      const minB = Math.min(...b.fichas.map((f) => f.video));
      return minA - minB;
    });

  cache = groups;
  return groups;
}

export function getAllFichas(): Ficha[] {
  return getTemas().flatMap((t) => t.fichas);
}

export function getFicha(slug: string): Ficha | null {
  return getAllFichas().find((f) => f.slug === slug) ?? null;
}

/** Ficha anterior y siguiente dentro del mismo tema, para navegar en la lectura. */
export function getFichaNeighbors(slug: string): { prev: Ficha | null; next: Ficha | null } {
  const groups = getTemas();
  for (const group of groups) {
    const i = group.fichas.findIndex((f) => f.slug === slug);
    if (i === -1) continue;
    return {
      prev: i > 0 ? group.fichas[i - 1] : null,
      next: i < group.fichas.length - 1 ? group.fichas[i + 1] : null,
    };
  }
  return { prev: null, next: null };
}
