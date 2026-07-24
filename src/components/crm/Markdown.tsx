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

export function Markdown({ texto }: { texto: string }) {
  const lineas = texto.split("\n");
  const bloques: React.ReactNode[] = [];
  let lista: string[] = [];

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

  for (const linea of lineas) {
    const l = linea.trim();
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

  return (
    <div className="space-y-2 text-[13.5px] leading-relaxed text-[var(--crm-ink)]">{bloques}</div>
  );
}
