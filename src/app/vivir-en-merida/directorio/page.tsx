import type { Metadata } from "next";
import Image from "next/image";
import { SiteNav } from "@/components/vivir/site-nav";
import { SiteFooter } from "@/components/vivir/footer";
import { DirectoryExplorer } from "@/components/vivir/directory-explorer";
import { getDirectoryPlaces } from "@/lib/directory/queries";
import { SAMPLE_ZONAS } from "@/lib/directory/sample-data";

export const metadata: Metadata = {
  title: "El directorio de Mérida",
  description:
    "Una lista corta y depurada de los mejores lugares de Mérida: dónde comer, tomar café y salir. Para quien se muda o invierte en la ciudad.",
};

export default async function DirectorioPage() {
  const places = await getDirectoryPlaces();

  return (
    <>
      <SiteNav overHero />
      <main className="bg-canvas text-ink">
        {/* Hero con foto de Mérida */}
        <section className="relative flex min-h-[54vh] w-full items-end overflow-hidden">
          <Image
            src="/hero/merida-plaza-grande.webp"
            alt="Centro histórico de Mérida, Yucatán"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/55 to-espresso/15" />
          <div className="relative z-10 w-full px-6 pb-14 pt-36 md:px-10 md:pb-16">
            <div className="mx-auto max-w-[1440px]">
              <p className="text-xs uppercase tracking-[0.22em] text-crema/80 [text-shadow:0_1px_8px_rgba(0,0,0,0.4)]">
                Vivir en Yucatán
              </p>
              <h1 className="mt-4 max-w-3xl font-display text-4xl font-light leading-[1.03] tracking-[-0.02em] text-crema [text-shadow:0_2px_18px_rgba(0,0,0,0.45)] md:text-6xl">
                El directorio de Mérida
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-crema/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.4)]">
                Una lista corta y depurada: los mejores lugares para comer, tomar café y salir en
                Mérida. Pensada para quien se muda o invierte aquí y quiere disfrutar la ciudad desde
                el primer día.
              </p>
            </div>
          </div>
        </section>

        <DirectoryExplorer places={places} zonas={SAMPLE_ZONAS} />
      </main>
      <SiteFooter />
    </>
  );
}
