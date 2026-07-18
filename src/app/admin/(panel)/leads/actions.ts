"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, type LeadStatus } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";

const STATUSES: LeadStatus[] = ["nuevo", "contactado", "enviado_crm", "cerrado"];

export async function updateLeadStatus(id: string, status: string) {
  await requireAdmin();
  if (!STATUSES.includes(status as LeadStatus)) return;
  await db
    .update(leads)
    .set({ status: status as LeadStatus, updatedAt: new Date() })
    .where(eq(leads.id, id));
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${id}`);
}
