import { MessageCircle } from "lucide-react";
import { waLink } from "@/lib/site";

type Props = {
  message: string;
  label?: string;
  variant?: "solid" | "outline";
};

// Deep link a WhatsApp con mensaje pre-armado por página (incluye la zona/desarrollo,
// así el desarrollador ve de dónde llega el contacto). Sin JS de cliente: es un <a>.
export function WhatsAppButton({ message, label = "Escríbenos por WhatsApp", variant = "solid" }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm transition";
  const styles =
    variant === "solid"
      ? "bg-terracota text-canvas hover:bg-terracota-deep"
      : "border border-ink/25 text-ink hover:border-terracota hover:text-terracota";

  return (
    <a
      href={waLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${styles}`}
    >
      <MessageCircle className="h-4 w-4" />
      {label}
    </a>
  );
}
