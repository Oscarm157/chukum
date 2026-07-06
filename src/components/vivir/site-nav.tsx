"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { href: "/vivir-en-merida/zonas/merida-norte", label: "Zonas" },
  { href: "/vivir-en-merida/desarrollos/ciudad-central-merida", label: "Desarrollos" },
  { href: "/vivir-en-merida#contacto", label: "Contacto" },
];

// Nav transparente sobre el hero → limestone (canvas) al hacer scroll.
// `overHero`: pásalo false en páginas SIN hero oscuro para que arranque en modo claro;
// déjalo true (default) cuando la página tenga un hero oscuro de fondo.
export function SiteNav({ overHero = true }: { overHero?: boolean }) {
  const [scrolled, setScrolled] = useState(!overHero);

  useEffect(() => {
    if (!overHero) return;
    function onScroll() {
      setScrolled(window.scrollY > window.innerHeight * 0.85);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overHero]);

  const dark = overHero && !scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 text-sm transition-colors duration-300 md:px-10 ${
        dark
          ? "border-b border-transparent bg-transparent text-crema"
          : "border-b border-hairline bg-canvas/85 text-ink backdrop-blur-md"
      }`}
    >
      <Link href="/vivir-en-merida" className="font-display text-lg leading-none tracking-[-0.02em]">
        Vivir en Yucatán
      </Link>

      <nav className="hidden items-center gap-1 md:flex">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-full px-3 py-1.5 transition ${
              dark ? "hover:bg-white/10" : "hover:bg-ink/5"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <Link
        href="/vivir-en-merida#contacto"
        className={`rounded-full border px-4 py-1.5 transition ${
          dark
            ? "border-crema/40 hover:bg-crema hover:text-espresso"
            : "border-terracota/50 text-terracota hover:bg-terracota hover:text-canvas"
        }`}
      >
        Solicitar info
      </Link>
    </header>
  );
}
