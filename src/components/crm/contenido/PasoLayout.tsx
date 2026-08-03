"use client";

/**
 * Continente de los tres pasos del editor de imagen. Reparte la pantalla igual para los
 * tres: en pantalla ancha el lienzo se queda con la columna grande y los controles con una
 * columna angosta a la derecha (con las pestañas arriba y la acción del paso fija abajo);
 * en pantalla angosta se apila, controles arriba y lienzo abajo.
 *
 * Cada paso decide QUÉ va en cada zona; el reparto vive aquí una sola vez.
 */
export function PasoLayout({
  pestanas,
  controles,
  acciones,
  lienzo,
  error,
}: {
  /** Selector de paso del workspace: encabeza la columna de controles. */
  pestanas: React.ReactNode;
  controles: React.ReactNode;
  /** Lo que aplica el paso. Fijo abajo de la columna: no se pierde al scrollear. */
  acciones: React.ReactNode;
  lienzo: React.ReactNode;
  error?: string | null;
}) {
  return (
    // `lg:h-full` solo desde lg: en angosto las alturas son naturales y quien scrollea es
    // el cuerpo del workspace; en ancho cada columna scrollea por su cuenta.
    <div className="flex flex-col lg:h-full lg:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-[var(--crm-line)] bg-[var(--crm-surface-2)] lg:order-2 lg:h-full lg:w-[340px] lg:border-b-0 lg:border-l xl:w-[372px]">
        <div className="shrink-0 border-b border-[var(--crm-line)] px-4 py-2.5">{pestanas}</div>
        {/* `min-h-0` para que el overflow de esta zona funcione dentro del flex. */}
        <div className="min-h-0 px-4 py-4 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">{controles}</div>
        <div className="shrink-0 border-t border-[var(--crm-line)] px-4 py-3">
          {acciones}
          {error && (
            <p className="mt-2 text-[12.5px] leading-snug" style={{ color: "var(--destructive)" }}>
              {error}
            </p>
          )}
        </div>
      </aside>
      <section className="flex min-w-0 flex-col bg-[var(--crm-bg)] p-3 lg:order-1 lg:h-full lg:flex-1 lg:p-5">
        {lienzo}
      </section>
    </div>
  );
}

/** Etiqueta de grupo de la columna de controles. */
export const controlLabel = "mb-1.5 block text-[12.5px] font-medium text-[var(--crm-ink-soft)]";
