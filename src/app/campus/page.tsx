import { getTemas } from "@/lib/campus-kb";
import { KbBrowser } from "@/components/campus/kb-browser";

export default function CampusIndexPage() {
  const temas = getTemas();
  return <KbBrowser temas={temas} />;
}
