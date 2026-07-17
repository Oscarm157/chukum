"use client";

import { useEffect, useState } from "react";
import { Menu, X, Compass, Building2, MessageCircle } from "lucide-react";
import { waLink } from "@/lib/site";

const LINKS = [
  { href: "#quiz", label: "Encuentra tu desarrollo" },
  { href: "#desarrollos", label: "Desarrollos" },
  { href: "#por-que", label: "Por qué Yucatán" },
  { href: "#contacto", label: "Contacto" },
];

const WA_MSG = "Hola, vengo del sitio de Chukum y quiero información de sus desarrollos.";

// Header fijo + menú mobile (sheet propio) + barra de acción inferior en mobile. Resuelve
// la navegación móvil que antes no existía: en pantallas chicas hay hamburguesa arriba y
// accesos de pulgar abajo (Quiz · Desarrollos · WhatsApp).
export function ChukumNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const light = !scrolled; // sobre el hero oscuro: texto claro

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled ? "border-b border-hairline bg-canvas/90 backdrop-blur-md" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center px-5 md:px-10">
          <a
            href="#top"
            className={`text-sm font-bold tracking-[0.3em] transition-colors ${light ? "text-crema" : "text-ink"}`}
          >
            CHUKUM
          </a>

          <nav className="ml-auto hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`text-sm transition-colors ${light ? "text-crema/85 hover:text-crema" : "text-ink-2 hover:text-ink"}`}
              >
                {l.label}
              </a>
            ))}
            <a
              href="#quiz"
              className="rounded-full bg-cenote px-5 py-2 text-sm font-medium text-canvas transition hover:bg-cenote-deep"
            >
              Empezar
            </a>
          </nav>

          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className={`ml-auto md:hidden ${light ? "text-crema" : "text-ink"}`}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Sheet mobile */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-espresso/50" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-[82%] max-w-sm flex-col bg-canvas p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold tracking-[0.3em] text-ink">CHUKUM</span>
              <button onClick={() => setOpen(false)} aria-label="Cerrar menú" className="text-ink-2">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-8 flex flex-col gap-1">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-hairline py-4 font-display text-2xl tracking-[-0.02em] text-ink"
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <a
              href={waLink(WA_MSG)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-cenote px-6 py-3.5 text-sm font-medium text-canvas"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Barra de acción inferior (solo mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-canvas/95 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-3">
          <BottomLink href="#quiz" icon={<Compass className="h-5 w-5" />} label="Quiz" />
          <BottomLink href="#desarrollos" icon={<Building2 className="h-5 w-5" />} label="Desarrollos" />
          <a
            href={waLink(WA_MSG)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 py-2.5 text-cenote"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-[11px]">WhatsApp</span>
          </a>
        </div>
      </nav>
    </>
  );
}

function BottomLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} className="flex flex-col items-center gap-1 py-2.5 text-ink-2 transition active:text-ink">
      {icon}
      <span className="text-[11px]">{label}</span>
    </a>
  );
}
