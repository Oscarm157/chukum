import type { Metadata } from "next";
import { Fraunces } from "next/font/google";

// Serif display scopeado a /campus para los titulos del lector. El cuerpo hereda
// DM Sans del layout raiz; aqui solo se agrega la variable del serif.
const fraunces = Fraunces({
  variable: "--font-campus-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Campus ORVE · Base de conocimientos",
  description: "Resúmenes de los videos de capacitación Campus ORVE.",
  robots: { index: false, follow: false },
};

export default function CampusLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`campus ${fraunces.variable} min-h-dvh bg-paper text-ink`}>
      {children}
    </div>
  );
}
