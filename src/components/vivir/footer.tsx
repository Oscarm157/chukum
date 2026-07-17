import Link from "next/link";
import { CONTENT_BRAND, waLink } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-surface-warm">
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-10">
        <p className="max-w-lg font-display text-3xl leading-[1.1] tracking-[-0.02em] md:text-4xl">
          Compra terreno o casa en el norte de Mérida.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-8 border-t border-hairline pt-10 md:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-ink-2">Zonas</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/vivir-en-merida/zonas/merida-norte" className="transition hover:text-terracota">
                Mérida Norte
              </Link>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-ink-2">Desarrollos</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link
                href="/vivir-en-merida/desarrollos/ciudad-central-merida"
                className="transition hover:text-terracota"
              >
                Ciudad Central Mérida
              </Link>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-ink-2">Contacto</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <a
                href={waLink("Hola, quiero información de desarrollos en Yucatán.")}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-terracota"
              >
                WhatsApp
              </a>
              <Link href="/vivir-en-merida#contacto" className="transition hover:text-terracota">
                Enviar mensaje
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-hairline pt-6 text-xs text-ink-2 md:flex-row md:items-center md:justify-between">
          <p className="max-w-2xl">
            {CONTENT_BRAND.name} comercializa desarrollos de terceros. Amenidades y avances mostrados son
            material del desarrollador; disponibilidad y precios se confirman al solicitar informes.
          </p>
          <p>© {new Date().getFullYear()} {CONTENT_BRAND.name}</p>
        </div>
      </div>
    </footer>
  );
}
