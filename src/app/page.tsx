import { redirect } from "next/navigation";

// Raíz del sitio unificado: la home vive en /inicio (corporativo verde Orve).
export default function RootPage() {
  redirect("/inicio");
}
