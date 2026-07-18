// Encabezado editorial consistente: índice (hilo 01/02/03…) + hairline + eyebrow + título.
// El mismo lenguaje del hero, repetido en cada sección para que el sitio se sienta uno.
export function SectionHead({
  index,
  eyebrow,
  title,
  dark = false,
}: {
  index: string;
  eyebrow: string;
  title: string;
  dark?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className={`font-display text-base leading-none ${dark ? "text-crema/70" : "text-ink-2"}`}>
          {index}
        </span>
        <span className={`h-px w-10 ${dark ? "bg-crema/30" : "bg-hairline"}`} />
        <span className={`text-xs uppercase tracking-[0.24em] ${dark ? "text-crema/70" : "text-cenote"}`}>
          {eyebrow}
        </span>
      </div>
      <h2
        className={`mt-4 max-w-2xl font-display text-4xl leading-[1.05] tracking-[-0.02em] md:text-5xl ${
          dark ? "text-crema" : ""
        }`}
      >
        {title}
      </h2>
    </div>
  );
}
