/**
 * Formateador mínimo para las respuestas del asistente: negritas, viñetas y
 * párrafos. No es un markdown completo a propósito: es lo que el modelo usa y
 * evita meter una dependencia entera para cuatro reglas.
 */

function conNegritas(texto: string) {
  // **negrita** y `código`, que es lo único inline que aparece en las respuestas.
  const partes = texto.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return partes.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[var(--crm-ink)]">
          {p.slice(2, -2)}
        </strong>
      );
    }
    if (p.startsWith("`") && p.endsWith("`")) {
      return (
        <code key={i} className="crm-num text-[12.5px] text-[var(--crm-ink)]">
          {p.slice(1, -1)}
        </code>
      );
    }
    return p;
  });
}

/** Fila de tabla markdown: | a | b | c | */
const esFilaTabla = (l: string) => l.startsWith("|") && l.endsWith("|") && l.length > 2;
const esSeparador = (l: string) => /^\|[\s:|-]+\|$/.test(l);
const celdas = (l: string) =>
  l.slice(1, -1).split("|").map((c) => c.trim());

export function Markdown({ texto }: { texto: string }) {
  const lineas = texto.split("\n");
  const bloques: React.ReactNode[] = [];
  let lista: string[] = [];
  let tabla: string[] = [];

  const cerrarLista = () => {
    if (!lista.length) return;
    bloques.push(
      <ul key={`l${bloques.length}`} className="space-y-1 pl-1">
        {lista.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-[var(--crm-ink-faint)]">·</span>
            <span>{conNegritas(item)}</span>
          </li>
        ))}
      </ul>,
    );
    lista = [];
  };

  const cerrarTabla = () => {
    if (!tabla.length) return;
    const filas = tabla.filter((l) => !esSeparador(l)).map(celdas);
    const [encabezado, ...cuerpo] = filas;
    bloques.push(
      <div key={`t${bloques.length}`} className="-mx-1 overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              {encabezado.map((c, i) => (
                <th
                  key={i}
                  className={`border-b border-[var(--crm-line)] px-2 py-1.5 font-medium text-[var(--crm-ink-mute)] ${
                    i === 0 ? "text-left" : "text-right"
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cuerpo.map((fila, i) => (
              <tr key={i} className="border-b border-[var(--crm-line-soft,var(--crm-line))]">
                {fila.map((c, j) => (
                  <td
                    key={j}
                    className={`px-2 py-1.5 ${
                      j === 0
                        ? "text-left text-[var(--crm-ink)]"
                        : "crm-num text-right text-[var(--crm-ink-soft)]"
                    }`}
                  >
                    {conNegritas(c)}
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

  for (const linea of lineas) {
    const l = linea.trim();
    if (esFilaTabla(l)) {
      cerrarLista();
      tabla.push(l);
      continue;
    }
    cerrarTabla();
    if (/^[-*•]\s+/.test(l)) {
      lista.push(l.replace(/^[-*•]\s+/, ""));
      continue;
    }
    if (/^\d+[.)]\s+/.test(l)) {
      lista.push(l.replace(/^\d+[.)]\s+/, ""));
      continue;
    }
    cerrarLista();
    if (!l) continue;
    if (/^#{1,4}\s+/.test(l)) {
      bloques.push(
        <p key={bloques.length} className="font-semibold text-[var(--crm-ink)]">
          {conNegritas(l.replace(/^#{1,4}\s+/, ""))}
        </p>,
      );
      continue;
    }
    bloques.push(<p key={bloques.length}>{conNegritas(l)}</p>);
  }
  cerrarLista();
  cerrarTabla();

  return (
    <div className="space-y-2 text-[13.5px] leading-relaxed text-[var(--crm-ink)]">{bloques}</div>
  );
}
