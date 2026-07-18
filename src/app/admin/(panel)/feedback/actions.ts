"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { feedbackLinks, feedbackNotes, type FeedbackStatus } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";

const TOKEN_CHARS = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function genToken(len = 28): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let out = "";
  for (const b of bytes) out += TOKEN_CHARS[b % TOKEN_CHARS.length];
  return out;
}

export async function createFeedbackLink(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const label = String(formData.get("label") ?? "").trim().slice(0, 120);
  if (!label) return { error: "Ponle un nombre al enlace (cliente o ronda)." };
  await db.insert(feedbackLinks).values({ label, token: genToken() });
  revalidatePath("/admin/feedback");
  return {};
}

export async function toggleFeedbackLink(id: string, active: boolean) {
  await requireAdmin();
  await db.update(feedbackLinks).set({ active }).where(eq(feedbackLinks.id, id));
  revalidatePath("/admin/feedback");
}

export async function setNoteStatus(id: string, status: FeedbackStatus) {
  await requireAdmin();
  if (status !== "open" && status !== "resolved") return;
  await db.update(feedbackNotes).set({ status }).where(eq(feedbackNotes.id, id));
  revalidatePath("/admin/feedback");
}

export async function deleteNote(id: string) {
  await requireAdmin();
  await db.delete(feedbackNotes).where(eq(feedbackNotes.id, id));
  revalidatePath("/admin/feedback");
}
