"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, X, MessageCircle, Compass, Building2, ChevronDown, ArrowRight } from "lucide-react";
import { waLink } from "@/lib/site";

// Anclas de la propia home.
const ANCHORS = [
  { href: "#desarrollos", label: "Desarrollos" },
  { href: "#por-que", label: "Por qué Yucatán" },
  { href: "#contacto", label: "Contacto" },
];

// Rutas de la guía "Vivir en Yucatán" (mega-menú + sheet mobile).
const GUIA_LINKS = [
  {
    n: "01",
    href: "/vivir-en-merida/directorio",
    label: "Directorio de Mérida",
    hint: "Cafés, restaurantes y cocina yucateca por zona",
  },
  {
    n: "02",
    href: "/vivir-en-merida/zonas/merida-norte",
    label: "Zonas · Mérida Norte",
    hint: "Perfil de la zona y desarrollos disponibles",
  },
  {
    n: "03",
    href: "/vivir-en-merida/desarrollos/ciudad-central-merida",
    label: "Desarrollos en la guía",
    hint: "Fichas con amenidades y avance de obra",
  },
];

const WA_MSG = "Hola, vi el sitio de Chukum y quiero info de casas, terrenos o departamentos.";
const EASE = [0.16, 1, 0.3, 1] as const;

// Header full-width al estilo BG/Vertice: barra transparente sobre el hero → sólida al scroll,
// con un mega-menú ancho (borde a borde) que baja al pasar por "Vivir en Yucatán". Conecta la
// home con la guía. En mobile: sheet lateral + barra de pulgar (Quiz · Desarrollos · WhatsApp).
export function ChukumNav() {
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMega(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function openMega() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMega(true);
  }
  function scheduleCloseMega() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMega(false), 120);
  }

  // Sobre el hero oscuro el texto es claro; al scrollear o con el mega-menú abierto pasa a sólido.
  const solid = scrolled || mega;
  const light = !solid;

  return (
    <>
      <header
        onMouseLeave={scheduleCloseMega}
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          solid ? "border-b border-hairline bg-canvas/90 backdrop-blur-md" : "border-b border-transparent bg-transparent"
        }`}
      >
        <div
          className={`mx-auto flex max-w-[1400px] items-center px-5 transition-[height] duration-300 md:px-10 ${
            scrolled ? "h-14" : "h-20"
          }`}
        >
          <a
            href="#top"
            className={`font-bold tracking-[0.24em] transition-all ${scrolled ? "text-lg md:text-xl" : "text-xl md:text-2xl"} ${light ? "text-crema [text-shadow:0_1px_10px_rgba(0,0,0,0.35)]" : "text-ink"}`}
          >
            CHUKUM
          </a>

          <nav className="ml-auto hidden items-center gap-7 md:flex">
            <a
              href="#desarrollos"
              className={`text-[15px] transition-colors ${light ? "text-crema/85 hover:text-crema" : "text-ink-2 hover:text-ink"}`}
            >
              Desarrollos
            </a>

            {/* Trigger del mega-menú */}
            <button
              type="button"
              onMouseEnter={openMega}
              onFocus={openMega}
              onClick={() => setMega((v) => !v)}
              aria-expanded={mega}
              aria-haspopup="true"
              className={`flex items-center gap-1 text-[15px] transition-colors ${
                mega ? "text-ink" : light ? "text-crema/85 hover:text-crema" : "text-ink-2 hover:text-ink"
              }`}
            >
              Vivir en Yucatán
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${mega ? "rotate-180" : ""}`} />
            </button>

            <a
              href="#por-que"
              className={`text-[15px] transition-colors ${light ? "text-crema/85 hover:text-crema" : "text-ink-2 hover:text-ink"}`}
            >
              Por qué Yucatán
            </a>
            <a
              href="#contacto"
              className={`text-[15px] transition-colors ${light ? "text-crema/85 hover:text-crema" : "text-ink-2 hover:text-ink"}`}
            >
              Contacto
            </a>
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

        {/* Mega-menú "Vivir en Yucatán" (desktop, full-width) */}
        <AnimatePresence>
          {mega && (
            <motion.div
              key="mega-vivir"
              initial={{ opacity: 0, y: reduce ? 0 : -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -8 }}
              transition={{ duration: 0.2, ease: EASE }}
              onMouseEnter={openMega}
              className="absolute inset-x-0 top-full hidden border-t border-hairline bg-canvas md:block"
            >
              <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-10 md:px-10 lg:grid-cols-[0.8fr_2fr] lg:gap-16">
                <div className="flex flex-col items-start">
                  <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-cenote">
                    <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-cenote" />
                    Vivir en Yucatán
                  </span>
                  <h3 className="mt-4 max-w-xs font-display text-2xl leading-tight tracking-[-0.02em] text-ink">
                    La guía de la península
                  </h3>
                  <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-ink-2">
                    Zonas, directorio y desarrollos para decidir dónde comprar y cómo se vive en Yucatán.
                  </p>
                  <Link
                    href="/vivir-en-merida"
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-cenote transition hover:text-cenote-deep"
                  >
                    Explorar la guía <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="flex flex-col gap-1 lg:border-l lg:border-hairline lg:pl-16">
                  {GUIA_LINKS.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="group flex items-baseline gap-3 rounded-2xl px-3 py-3 transition hover:bg-surface-warm"
                    >
                      <span className="font-mono text-[11px] tabular-nums text-cenote">{l.n}</span>
                      <span>
                        <span className="block font-display text-[16px] text-ink transition-colors group-hover:text-cenote">
                          {l.label}
                        </span>
                        <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-2">{l.hint}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
            <nav className="mt-8 flex flex-col gap-1 overflow-y-auto">
              <a
                href="#quiz"
                onClick={() => setOpen(false)}
                className="border-b border-hairline py-4 font-display text-2xl tracking-[-0.02em] text-ink"
              >
                Encuentra tu desarrollo
              </a>
              {ANCHORS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-hairline py-4 font-display text-2xl tracking-[-0.02em] text-ink"
                >
                  {l.label}
                </a>
              ))}
              <Link
                href="/vivir-en-merida"
                onClick={() => setOpen(false)}
                className="border-b border-hairline py-4 font-display text-2xl tracking-[-0.02em] text-ink"
              >
                Vivir en Yucatán
              </Link>
              <Link
                href="/vivir-en-merida/directorio"
                onClick={() => setOpen(false)}
                className="border-b border-hairline py-4 font-display text-2xl tracking-[-0.02em] text-ink"
              >
                Directorio de Mérida
              </Link>
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
