import type { Metadata } from "next";
import { Fraunces, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import { Toaster } from "@/components/ui/sonner";
import { SmoothScroll } from "@/components/smooth-scroll";

// Display: Fraunces variable (óptica cálida, alto contraste) para titulares.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

// Body: Inter para cuerpo y UI.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Mono: Geist Mono (tabular) para specs, m², stats.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Vivir en Yucatán | Casas, terrenos y desarrollos en Mérida",
    template: "%s | Vivir en Yucatán",
  },
  description:
    "Guía de zonas y desarrollos para comprar e invertir en el norte de Mérida y Yucatán: perfil de cada zona, amenidades y disponibilidad directa con el desarrollador.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas font-sans text-ink">
        <SmoothScroll />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
