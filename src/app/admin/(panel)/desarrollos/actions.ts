"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  developments,
  developmentImages,
  units,
  type MacroZona,
  type Uso,
  type UnitType,
  type UnitStatus,
  type DevelopmentStatus,
  type HighlightSpec,
} from "@/lib/schema";
import { uploadImage } from "@/lib/blob";
import { requireAdmin } from "@/lib/session";
import { safeParseForm } from "@/lib/validate";

const MACRO_ZONAS: MacroZona[] = ["merida", "costa", "caribe", "selva"];
const USOS: Uso[] = ["invertir", "vivir"];
const UNIT_TYPES: UnitType[] = ["terreno", "casa", "departamento", "townhouse", "local_comercial"];
const UNIT_STATUSES: UnitStatus[] = ["disponible", "apartado", "vendido"];
const DEV_STATUSES: DevelopmentStatus[] = ["preventa", "en_construccion", "entrega_inmediata", "vendido"];

// --- helpers de parseo (arrays y numéricos que Zod-desde-FormData no cubre bien) ---
const str = (v: FormDataEntryValue | null): string | null => {
  const t = String(v ?? "").trim();
  return t || null;
};
const int = (v: FormDataEntryValue | null): number | null => {
  const d = String(v ?? "").replace(/[^\d]/g, "");
  if (d === "") return null;
  const n = parseInt(d, 10);
  return Number.isFinite(n) ? Math.min(n, 2_000_000_000) : null;
};
const num = (v: FormDataEntryValue | null): string | null => {
  const t = String(v ?? "").trim();
  return /^\d+(\.\d+)?$/.test(t) ? t : null; // numeric() de drizzle recibe string
};
const list = (arr: FormDataEntryValue[], allowed: readonly string[]) =>
  arr.map(String).filter((x) => allowed.includes(x));
const csv = (v: FormDataEntryValue | null): string[] =>
  String(v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

async function guard() {
  await requireAdmin();
}

// ===================== Desarrollos =====================

// Solo lo escalar y obligatorio pasa por Zod; arrays/specs se arman a mano.
const desarrolloScalar = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  slug: z
    .string()
    .trim()
    .min(1, "El slug es obligatorio.")
    .regex(/^[a-z0-9-]+$/, "El slug solo admite minúsculas, números y guiones."),
});

function desarrolloValues(f: FormData) {
  const macroZonaRaw = String(f.get("macroZona") ?? "");
  const statusRaw = String(f.get("statusMarketing") ?? "");

  const highlightSpecs: HighlightSpec[] = [];
  for (let i = 0; i < 3; i++) {
    const label = str(f.get(`specLabel${i}`));
    const value = str(f.get(`specValue${i}`));
    if (label && value) highlightSpecs.push({ label, value });
  }

  return {
    name: String(f.get("name") ?? "").trim(),
    slug: String(f.get("slug") ?? "").trim(),
    heading: str(f.get("heading")),
    zonaId: str(f.get("zonaId")),
    city: str(f.get("city")),
    state: str(f.get("state")),
    macroZona: MACRO_ZONAS.includes(macroZonaRaw as MacroZona) ? (macroZonaRaw as MacroZona) : null,
    usos: list(f.getAll("usos"), USOS) as Uso[],
    propertyTypes: list(f.getAll("propertyTypes"), UNIT_TYPES) as UnitType[],
    statusMarketing: DEV_STATUSES.includes(statusRaw as DevelopmentStatus)
      ? (statusRaw as DevelopmentStatus)
      : null,
    descriptionEs: str(f.get("descriptionEs")),
    descriptionEn: str(f.get("descriptionEn")),
    amenities: csv(f.get("amenities")),
    highlightSpecs,
    sourceUrlEs: str(f.get("sourceUrlEs")),
    sourceUrlEn: str(f.get("sourceUrlEn")),
    verified: f.get("verified") === "on",
    dataSource: "oscar_manual" as const,
  };
}

export async function createDesarrollo(formData: FormData) {
  await guard();
  const check = safeParseForm(desarrolloScalar, formData);
  if (!check.ok) redirect(`/admin/desarrollos/nuevo?error=${encodeURIComponent(check.error)}`);
  const v = desarrolloValues(formData);
  const rows = await db.insert(developments).values(v).returning({ id: developments.id });
  revalidatePath("/admin/desarrollos");
  redirect(`/admin/desarrollos/${rows[0].id}`);
}

export async function updateDesarrollo(id: string, formData: FormData) {
  await guard();
  const check = safeParseForm(desarrolloScalar, formData);
  if (!check.ok) redirect(`/admin/desarrollos/${id}?error=${encodeURIComponent(check.error)}`);
  const v = desarrolloValues(formData);
  await db.update(developments).set({ ...v, updatedAt: new Date() }).where(eq(developments.id, id));
  revalidatePath("/admin/desarrollos");
  revalidatePath(`/admin/desarrollos/${id}`);
  redirect("/admin/desarrollos");
}

export async function deleteDesarrollo(id: string) {
  await guard();
  // Borra los blobs de sus imágenes antes del cascade de la fila.
  const imgs = await db
    .select({ url: developmentImages.url })
    .from(developmentImages)
    .where(eq(developmentImages.developmentId, id));
  for (const img of imgs) {
    try {
      await del(img.url);
    } catch (e) {
      console.error("[desarrollos] fallo al borrar blob", img.url, e);
    }
  }
  await db.delete(developments).where(eq(developments.id, id));
  revalidatePath("/admin/desarrollos");
  redirect("/admin/desarrollos");
}

// ===================== Modelos (units) =====================

function modeloValues(f: FormData) {
  const typeRaw = String(f.get("unitType") ?? "");
  const statusRaw = String(f.get("status") ?? "");
  return {
    unitCode: str(f.get("unitCode")),
    unitType: (UNIT_TYPES.includes(typeRaw as UnitType) ? typeRaw : "terreno") as UnitType,
    status: (UNIT_STATUSES.includes(statusRaw as UnitStatus) ? statusRaw : "disponible") as UnitStatus,
    areaM2: num(f.get("areaM2")),
    priceMxn: int(f.get("priceMxn")),
    bedrooms: int(f.get("bedrooms")),
    bathrooms: num(f.get("bathrooms")),
    levels: int(f.get("levels")),
    notes: str(f.get("notes")),
    dataSource: "oscar_manual" as const,
  };
}

export async function addModelo(devId: string, formData: FormData) {
  await guard();
  await db.insert(units).values({ developmentId: devId, ...modeloValues(formData) });
  revalidatePath(`/admin/desarrollos/${devId}`);
}

export async function updateModelo(devId: string, unitId: string, formData: FormData) {
  await guard();
  await db
    .update(units)
    .set({ ...modeloValues(formData), updatedAt: new Date() })
    .where(eq(units.id, unitId));
  revalidatePath(`/admin/desarrollos/${devId}`);
}

export async function deleteModelo(devId: string, unitId: string) {
  await guard();
  await db.delete(units).where(eq(units.id, unitId));
  revalidatePath(`/admin/desarrollos/${devId}`);
}

// ===================== Imágenes (galería) =====================

export async function uploadDesarrolloImage(
  devId: string,
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  await guard();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No se recibió archivo." };
  const res = await uploadImage(`desarrollos/${devId}`, file);
  if ("error" in res) return { error: res.error };
  // La nueva imagen va al final; si es la primera, se marca como hero.
  const existing = await db
    .select({ id: developmentImages.id })
    .from(developmentImages)
    .where(eq(developmentImages.developmentId, devId));
  await db.insert(developmentImages).values({
    developmentId: devId,
    url: res.url,
    pathname: res.pathname,
    alt: str(formData.get("alt")),
    kind: existing.length === 0 ? "hero" : "gallery",
    sortOrder: existing.length,
  });
  revalidatePath(`/admin/desarrollos/${devId}`);
  return { ok: true };
}

export async function deleteDesarrolloImage(devId: string, imageId: string) {
  await guard();
  const rows = await db
    .select({ url: developmentImages.url })
    .from(developmentImages)
    .where(eq(developmentImages.id, imageId));
  if (rows[0]) {
    try {
      await del(rows[0].url);
    } catch (e) {
      console.error("[desarrollos] fallo al borrar blob", rows[0].url, e);
    }
  }
  await db.delete(developmentImages).where(eq(developmentImages.id, imageId));
  revalidatePath(`/admin/desarrollos/${devId}`);
}

export async function setHeroImage(devId: string, imageId: string) {
  await guard();
  // Solo una hero por desarrollo: el resto pasa a gallery.
  const imgs = await db
    .select({ id: developmentImages.id })
    .from(developmentImages)
    .where(eq(developmentImages.developmentId, devId));
  for (const img of imgs) {
    await db
      .update(developmentImages)
      .set({ kind: img.id === imageId ? "hero" : "gallery" })
      .where(eq(developmentImages.id, img.id));
  }
  revalidatePath(`/admin/desarrollos/${devId}`);
}

export async function reorderImages(devId: string, orderedIds: string[]) {
  await guard();
  await Promise.all(
    orderedIds.map((id, i) =>
      db.update(developmentImages).set({ sortOrder: i }).where(eq(developmentImages.id, id))
    )
  );
  revalidatePath(`/admin/desarrollos/${devId}`);
}
