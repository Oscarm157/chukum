import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { feedbackLinks, feedbackNotes } from "@/lib/schema";
import { FeedbackBoard } from "./FeedbackBoard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Comentarios del sitio", robots: { index: false } };

export default async function FeedbackPage() {
  await requireAdmin();

  const links = await db
    .select({
      id: feedbackLinks.id,
      label: feedbackLinks.label,
      token: feedbackLinks.token,
      active: feedbackLinks.active,
      createdAt: feedbackLinks.createdAt,
    })
    .from(feedbackLinks)
    .orderBy(desc(feedbackLinks.createdAt));

  const notes = await db
    .select({
      id: feedbackNotes.id,
      linkId: feedbackNotes.linkId,
      linkLabel: feedbackLinks.label,
      path: feedbackNotes.path,
      note: feedbackNotes.note,
      selector: feedbackNotes.selector,
      elementText: feedbackNotes.elementText,
      pageTitle: feedbackNotes.pageTitle,
      status: feedbackNotes.status,
      createdAt: feedbackNotes.createdAt,
    })
    .from(feedbackNotes)
    .leftJoin(feedbackLinks, eq(feedbackNotes.linkId, feedbackLinks.id))
    .orderBy(desc(feedbackNotes.createdAt));

  const openCount = notes.filter((n) => n.status === "open").length;

  return (
    <main className="min-h-dvh bg-[#f4efe6] px-5 py-10 text-[#241e17] md:px-10">
      <div className="mx-auto max-w-[1100px]">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#2e7d6b]">Sitio</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em]">Comentarios del sitio</h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#6e6353]">
            Crea un enlace y ábrelo para comentar directo sobre el sitio en vivo. Aquí llegan tus notas
            con la página y la parte exacta a la que se refieren. Usa &ldquo;Copiar todo&rdquo; para pegármelas.
          </p>
        </header>
        <FeedbackBoard
          links={links.map((l) => ({ ...l, createdAt: l.createdAt ? l.createdAt.toISOString() : null }))}
          notes={notes.map((n) => ({ ...n, createdAt: n.createdAt ? n.createdAt.toISOString() : null }))}
          openCount={openCount}
        />
      </div>
    </main>
  );
}
