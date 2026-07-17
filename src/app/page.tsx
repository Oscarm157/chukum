import { redirect } from "next/navigation";

// Raíz del sitio unificado: la home vive en /inicio (corporativo Chukum).
export default function RootPage() {
  redirect("/inicio");
}
