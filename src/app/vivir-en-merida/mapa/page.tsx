import type { Metadata } from "next";
import { SiteNav } from "@/components/vivir/site-nav";
import { SiteFooter } from "@/components/vivir/footer";
import { MapaYucatan } from "@/components/chukum/mapa-yucatan";
import { PLUSVALIA_MERIDA } from "@/lib/mapa";

export const metadata: Metadata = {
  title: "Mapa de desarrollos en la península",
  description:
    "Dónde están los desarrollos que comercializa Chukum en la península de Yucatán, con puntos de interés cercanos: aeropuertos, hospitales, universidades y playas.",
  alternates: { canonical: "/vivir-en-merida/mapa" },
};

export default function MapaPage() {
  return (
    <>
      <SiteNav overHero={false} />
      <main className="bg-canvas pt-28 text-ink md:pt-36">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          <p className="text-xs uppercase tracking-[0.22em] text-terracota">Vivir en Yucatán</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-light leading-[1.05] tracking-[-0.02em] md:text-6xl">
            Dónde están los desarrollos
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-2">
            Los 5 desarrollos que comercializamos, ubicados en el mapa junto con los puntos de
            referencia cercanos: aeropuertos, hospitales, universidades, centros comerciales y
            playas. Filtra por categoría o toca un punto para ver el detalle.
          </p>
        </div>

        <div className="mx-auto max-w-[1440px] px-6 py-10 md:px-10 md:py-14">
          <MapaYucatan />
        </div>

        <section className="mx-auto max-w-[1440px] px-6 pb-20 md:px-10">
          <p className="text-xs uppercase tracking-[0.22em] text-terracota">Plusvalía en Mérida</p>
          <h2 className="mt-3 font-display text-2xl tracking-[-0.01em] md:text-3xl">
            Cómo se comporta cada zona
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">
            Clasificación de zonas según su madurez inmobiliaria y crecimiento de plusvalía.
            Aplica solo a Mérida; en Progreso, Tulum y Playa del Carmen la disponibilidad y precios
            se confirman por desarrollo.
          </p>
          <dl className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PLUSVALIA_MERIDA.map((z) => (
              <div key={z.nombre} className="rounded-2xl border border-hairline bg-surface-warm p-5">
                <dt className="font-display text-lg tracking-[-0.01em]">{z.nombre}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-2">{z.descripcion}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
