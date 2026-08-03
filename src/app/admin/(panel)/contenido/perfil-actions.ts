"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { agentProfiles } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";
import { uploadImage } from "@/lib/blob";
import { getPerfilActivo } from "@/lib/contenido-data";

/**
 * Perfil del vendedor que firma los posts. Es un settings singleton, no una lista: hay un
 * solo perfil activo y la firma del overlay siempre usa ese. Si no existe la fila, se crea;
 * si existe, se actualiza.
 */

const perfilSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre.").max(80, "El nombre no puede pasar de 80 caracteres."),
  phone: z.string().trim().max(40, "El teléfono no puede pasar de 40 caracteres.").optional(),
  photoFile: z.instanceof(File).optional(),
});

export async function guardarPerfilVendedor(
  input: unknown
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();

  const parsed = perfilSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const { name, phone, photoFile } = parsed.data;

  let foto: { url: string; pathname: string } | null = null;
  if (photoFile instanceof File && photoFile.size > 0) {
    const subida = await uploadImage("perfil", photoFile);
    if ("error" in subida) return { error: subida.error };
    foto = subida;
  }

  const actual = await getPerfilActivo();
  if (actual) {
    await db
      .update(agentProfiles)
      .set({
        name,
        phone: phone || null,
        // Sin foto nueva se conserva la que ya estaba: guardar solo el nombre no debe
        // borrar el retrato.
        ...(foto ? { photoUrl: foto.url, photoPathname: foto.pathname } : {}),
        updatedAt: new Date(),
      })
      .where(eq(agentProfiles.id, actual.id));
  } else {
    await db.insert(agentProfiles).values({
      name,
      phone: phone || null,
      photoUrl: foto?.url ?? null,
      photoPathname: foto?.pathname ?? null,
    });
  }

  revalidatePath("/admin/contenido/perfil");
  return { ok: true };
}

export type PerfilFirma = { name: string; phone: string | null; photoUrl: string | null };

// Lectura para el editor de overlay, que es un componente de cliente y no puede consultar
// la base directo.
export async function cargarPerfilFirma(): Promise<PerfilFirma | null> {
  await requireAdmin();
  const perfil = await getPerfilActivo();
  if (!perfil || !perfil.name.trim()) return null;
  return { name: perfil.name, phone: perfil.phone, photoUrl: perfil.photoUrl };
}
