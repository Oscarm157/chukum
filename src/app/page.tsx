// Home pública placeholder. Aquí va el sitio bespoke de Grupo-Orve (construido con
// el reference lock de Refero + DESIGN.md), sobre el catálogo real de developments/units.
export default function HomePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Grupo-Orve</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Bootstrap listo (plomería, schema, piloto de contenido de Xo&apos;ok). Falta
          construir el diseño bespoke sobre esta base.
        </p>
      </div>
    </main>
  );
}
