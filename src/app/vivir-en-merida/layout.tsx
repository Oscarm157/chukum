import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { SITE } from "@/lib/site";

// Sistema de diseño de "Vivir en Yucatán" scopeado a /vivir-en-merida: terracota +
// Fraunces (display) + Inter (cuerpo). Las variables de fuente se cuelgan del wrapper
// `.vivir`; los tokens de color y el override de --font-sans-display viven en globals.css
// bajo `.vivir`, sin tocar el verde corporativo de /inicio ni el de /campus.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Vivir en Mérida | Zonas y desarrollos del norte de la ciudad",
    template: "%s | Vivir en Mérida",
  },
  description:
    "Guía de zonas y desarrollos para comprar terreno, casa o departamento en el norte de Mérida, directo con el desarrollador.",
};

export default function VivirLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`vivir ${fraunces.variable} ${inter.variable} min-h-dvh bg-canvas font-sans text-ink`}>
      {children}
    </div>
  );
}
