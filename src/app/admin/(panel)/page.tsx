import { redirect } from "next/navigation";

// El panel entra directo al catálogo (v1 no tiene dashboard).
export default function AdminIndex() {
  redirect("/admin/desarrollos");
}
