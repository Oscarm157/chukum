import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "#xook", label: "Xo'ok" },
  { href: "#por-que-invertir", label: "¿Por qué invertir?" },
];

export function SiteNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-6 text-white md:px-10">
      <nav className="hidden items-center gap-6 text-sm md:flex">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full px-3 py-1.5 transition hover:bg-white/10"
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <Link href="#top" className="flex items-center gap-2 md:absolute md:left-1/2 md:-translate-x-1/2">
        <Image
          src="/brand/orve-logo-mark.png"
          alt="Grupo Orve"
          width={32}
          height={32}
          className="h-8 w-8 brightness-0 invert"
          priority
        />
        <span className="text-sm font-bold tracking-[0.3em]">ORVE</span>
      </Link>

      <Link
        href="#por-que-invertir"
        className="rounded-full border border-white/40 px-4 py-1.5 text-sm transition hover:bg-white hover:text-black"
      >
        Quiero invertir
      </Link>
    </header>
  );
}
