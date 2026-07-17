import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SmoothScroll } from "@/components/smooth-scroll";
import { FeedbackWidget } from "@/components/site/FeedbackWidget";

// DM Sans: geométrica, tracking apretado — sustituto real recomendado para F37Bolton
// (referencia Lightship, ver DESIGN.md) en vez del Geist por default del starter.
const dmSans = DM_Sans({
  variable: "--font-sans-display",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chukum",
  description: "Comercialización de desarrollos inmobiliarios en la península de Yucatán.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${dmSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <SmoothScroll />
        {children}
        <Toaster />
        <FeedbackWidget />
      </body>
    </html>
  );
}
