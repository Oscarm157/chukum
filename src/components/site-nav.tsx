"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { href: "#xook", label: "Xo'ok" },
  { href: "#por-que-invertir", label: "¿Por qué invertir?" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > window.innerHeight * 0.9);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-6 text-sm transition-colors duration-300 md:px-10 ${
        scrolled
          ? "border-b border-mist bg-cream/80 text-obsidian backdrop-blur-md"
          : "border-b border-transparent bg-transparent text-white"
      }`}
    >
      <nav className="hidden items-center gap-6 text-sm md:flex">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-full px-3 py-1.5 transition ${
              scrolled ? "hover:bg-obsidian/5" : "hover:bg-white/10"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <Link href="#top" className="md:absolute md:left-1/2 md:-translate-x-1/2">
        <span className="text-sm font-bold tracking-[0.3em]">ORVE</span>
      </Link>

      <Link
        href="#por-que-invertir"
        className={`rounded-full border px-4 py-1.5 text-sm transition ${
          scrolled
            ? "border-obsidian/40 hover:bg-obsidian hover:text-cream"
            : "border-white/40 hover:bg-white hover:text-black"
        }`}
      >
        Quiero invertir
      </Link>
    </header>
  );
}
