import type { Metadata } from "next";
import { AddFicha } from "@/components/campus/add-ficha";

export const metadata: Metadata = {
  title: "Agregar video · Campus Chukum",
  robots: { index: false, follow: false },
};

export default function AgregarPage() {
  return <AddFicha />;
}
