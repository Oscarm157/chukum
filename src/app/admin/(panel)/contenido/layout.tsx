import { fraunces, inter } from "@/lib/contenido/fonts";

// Monta Fraunces e Inter (las del sitio público) solo en este módulo: el editor de
// overlay las dibuja dentro del canvas y necesita que el navegador ya las tenga.
// Solo declara las variables de fuente; no aplica el tema `.chukum` al panel.
export default function ContenidoLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${fraunces.variable} ${inter.variable}`}>{children}</div>;
}
