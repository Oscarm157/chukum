import { Fraunces, Inter } from "next/font/google";

// Las mismas dos fuentes del sistema de diseño de Chukum (ver DESIGN-chukum.md). El
// panel no las carga, pero el editor de texto las necesita para dibujar dentro del
// canvas: el layout de /admin/contenido las monta y el editor espera a que estén
// disponibles antes del primer render.
export const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});
