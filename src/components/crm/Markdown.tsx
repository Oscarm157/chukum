/**
 * Formateador para las respuestas del asistente. No es markdown completo a
 * propósito: cubre lo que el modelo realmente escribe (negritas, cursivas,
 * enlaces, listas, tablas, citas) sin arrastrar una dependencia entera.
 */

import type { ReactNode } from "react";

/** Formato dentro de una línea: negrita, cursiva, código y enlaces. */
function conFormato(texto: string): ReactNode[] {
  const partes = texto.split(
    /(\{\{[^}]+\}\}|\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g,
  );
  return partes.map((p, i) => {
    if (p.startsWith("{{") && p.endsWith("}}")) {
      return (
        <span
          key={i}
          className="mx-0.5 rounded bg-[color-mix(in_srgb,var(--crm-accent)_14%,transparent)] px-1.5 py-px font-medium text-[var(--crm-accent-strong)] ring-1 ring-[color-mix(in_srgb,var(--crm-accent)_30%,transparent)] ring-inset"
        >
          {p.slice(2, -2)}
        </span>
      );
    }
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[var(--crm-ink)]">
          {conFormato(p.slice(2, -2))}
        </strong>
      );
    }
    if (p.startsWith("`") && p.endsWith("`")) {
      return (
        <code
          key={i}
          className="crm-num rounded bg-[var(--crm-surface-3)] px-1 py-0.5 text-[12.5px] text-[var(--crm-ink)]"
        >
          {p.slice(1, -1)}
        </code>
      );
    }
    const enlace = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(p);
    if (enlace) {
      return (
        <a
          key={i}
          href={enlace[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--crm-accent-strong)] underline underline-offset-2 hover:opacity-80"
        >
          {enlace[1]}
        </a>
      );
    }
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
      return (
        <em key={i} className="italic">
          {conFormato(p.slice(1, -1))}
        </em>
      );
    }
    // Las cifras no deben partirse a mitad de línea en una columna angosta.
    return p.split(/(\$[\d,.]+|\d[\d,]{3,})/g).map((t, j) =>
      /^(\$[\d,.]+|\d[\d,]{3,})$/.test(t) ? (
        <span key={`${i}-${j}`} className="crm-num whitespace-nowrap">
          {t}
        </span>
      ) : (
        t
      ),
    );
  });
}

const esFilaTabla = (l: string) => l.startsWith("|") && l.endsWith("|") && l.length > 2;
const esSeparadorTabla = (l: string) => /^\|[\s:|-]+\|$/.test(l);
const celdas = (l: string) => l.slice(1, -1).split("|").map((c) => c.trim());

type Item = { texto: string; numero?: number };

export function Markdown({ texto }: { texto: string }) {
  const lineas = texto.split("\n");
  const bloques: ReactNode[] = [];
  let lista: Item[] = [];
  let numerada = false;
  let tabla: string[] = [];
  let cita: string[] = [];

  const cerrarLista = () => {
    if (!lista.length) return;
    const items = lista;
    bloques.push(
      numerada ? (
        <ol key={`l${bloques.length}`} className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="crm-num mt-px min-w-[1.1rem] text-[12px] font-semibold text-[var(--crm-accent-strong)]">
                {item.numero ?? i + 1}.
              </span>
              <span className="min-w-0 flex-1">{conFormato(item.texto)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <ul key={`l${bloques.length}`} className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-[7px] size-1 shrink-0 rounded-full bg-[var(--crm-ink-faint)]" />
              <span className="min-w-0 flex-1">{conFormato(item.texto)}</span>
            </li>
          ))}
        </ul>
      ),
    );
    lista = [];
    numerada = false;
  };

  const cerrarCita = () => {
    if (!cita.length) return;
    const lineasCita = cita;
    bloques.push(
      <div
        key={`c${bloques.length}`}
        className="border-l-2 border-[var(--crm-ink-faint)] pl-3 text-[var(--crm-ink-soft)]"
      >
        {lineasCita.map((l, i) => (
          <p key={i}>{conFormato(l)}</p>
        ))}
      </div>,
    );
    cita = [];
  };

  const cerrarTabla = () => {
    if (!tabla.length) return;
    const filas = tabla.filter((l) => !esSeparadorTabla(l)).map(celdas);
    const [encabezado, ...cuerpo] = filas;
    bloques.push(
      <div key={`t${bloques.length}`} className="-mx-1 overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              {encabezado.map((c, i) => (
                <th
                  key={i}
                  className={`border-b border-[var(--crm-line)] px-2 py-1.5 font-medium whitespace-nowrap text-[var(--crm-ink-mute)] ${
                    i === 0
                      ? "sticky left-0 bg-[var(--crm-surface)] text-left"
                      : "text-right"
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cuerpo.map((fila, i) => (
              <tr key={i} className="border-b border-[var(--crm-line)]/50">
                {fila.map((c, j) => (
                  <td
                    key={j}
                    className={`px-2 py-1.5 ${
                      j === 0
                        ? "sticky left-0 bg-[var(--crm-surface)] text-left font-medium text-[var(--crm-ink)]"
                        : "crm-num text-right whitespace-nowrap text-[var(--crm-ink-soft)]"
                    }`}
                  >
                    {conFormato(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
    tabla = [];
  };

  const cerrarTodo = () => {
    cerrarLista();
    cerrarCita();
    cerrarTabla();
  };

  for (const linea of lineas) {
    const l = linea.trim();

    if (esFilaTabla(l)) {
      cerrarLista();
      cerrarCita();
      tabla.push(l);
      continue;
    }
    cerrarTabla();

    if (l.startsWith(">")) {
      cerrarLista();
      cita.push(l.replace(/^>\s?/, ""));
      continue;
    }
    cerrarCita();

    const vinieta = /^[-*•]\s+(.*)/.exec(l);
    if (vinieta) {
      if (numerada) cerrarLista();
      lista.push({ texto: vinieta[1] });
      continue;
    }
    const numero = /^(\d+)[.)]\s+(.*)/.exec(l);
    if (numero) {
      if (!numerada && lista.length) cerrarLista();
      numerada = true;
      lista.push({ texto: numero[2], numero: Number(numero[1]) });
      continue;
    }
    cerrarLista();

    if (!l) continue;

    if (/^(-{3,}|_{3,}|\*{3,})$/.test(l)) {
      bloques.push(<hr key={bloques.length} className="border-[var(--crm-line)]" />);
      continue;
    }

    const titulo = /^(#{1,4})\s+(.*)/.exec(l);
    if (titulo) {
      const nivel = titulo[1].length;
      bloques.push(
        <p
          key={bloques.length}
          className={
            nivel <= 2
              ? "pt-1 text-[15px] font-semibold tracking-tight text-[var(--crm-ink)]"
              : "text-[13.5px] font-semibold text-[var(--crm-ink)]"
          }
        >
          {conFormato(titulo[2])}
        </p>,
      );
      continue;
    }

    bloques.push(<p key={bloques.length}>{conFormato(l)}</p>);
  }
  cerrarTodo();

  return (
    <div className="space-y-2.5 text-[13.5px] leading-relaxed text-[var(--crm-ink)]">{bloques}</div>
  );
}
