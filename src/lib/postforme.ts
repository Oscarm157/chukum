import type { SocialPlatform } from "@/lib/schema";

// Cliente de la API de Post for Me (https://api.postforme.dev/v1). Puerto de
// /root/content-studio-dist/scripts/publish.mjs (probado en prod para content-studio),
// adaptado para publicar imágenes en vez de video.
//
// Contrato confirmado el 2026-08-03 leyendo el OpenAPI embebido en `data-configuration`
// del Scalar de https://api.postforme.dev/docs (la SPA no expone /docs/openapi.json):
// - `POST /social-posts`: `scheduled_at` nulo o ausente publica de inmediato (documentado
//   explícito en el schema: "setting to null or undefined will post instantly"). Con
//   fecha, programa.
// - `media[].url` solo se documenta como "Public URL of the media"; el único flujo que el
//   spec describe paso a paso es create-upload-url → PUT → usar `media_url` en el post.
//   No confirma si acepta una URL pública externa (ej. Vercel Blob) directo, así que se
//   usa el flujo documentado y ya probado en publish.mjs en vez de asumir el atajo.
// - `platform_configurations.instagram`/`.facebook` aceptan `placement: reels|stories|
//   timeline`, todos opcionales. Para un post de imagen normal (no reels) se omite
//   `placement`: cada plataforma cae a su default de feed.
// - Carrusel: no hay campo ni endpoint aparte. Mandar varios elementos en `media` arma
//   el carrusel solo, siempre que el placement sea el de feed. Con `placement: stories`
//   el spec dice que crea un post por cada media (N stories sueltos, no un carrusel),
//   así que el módulo fuerza formato de una sola imagen cuando se publica a story.
// - `GET /social-accounts` devuelve `{ data: SocialAccountDto[], meta }`, igual que asume
//   publish.mjs.

const API = "https://api.postforme.dev/v1";

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!process.env.POSTFORME_API_KEY) {
    throw new Error("Falta POSTFORME_API_KEY.");
  }
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.POSTFORME_API_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}\n${body}`);
  }
  return res.json() as Promise<T>;
}

export type PostForMeAccount = {
  id: string;
  platform: string;
  username: string | null;
};

type ListAccountsResponse = {
  data: PostForMeAccount[];
  meta: { total: number; offset: number; limit: number; next: string | null };
};

export async function listAccounts(): Promise<PostForMeAccount[]> {
  const res = await api<ListAccountsResponse>("/social-accounts?limit=100");
  return res.data;
}

type CreateUploadUrlResponse = {
  upload_url: string;
  media_url: string;
};

// Descarga la imagen (ya pública en Vercel Blob) y la resube al storage de Post for Me
// para obtener el `media_url` que exige `POST /social-posts`.
export async function uploadMedia(imageUrl: string): Promise<string> {
  const source = await fetch(imageUrl);
  if (!source.ok) {
    throw new Error(`No se pudo descargar la imagen (${imageUrl}) → ${source.status}`);
  }
  const contentType = source.headers.get("content-type") ?? "image/jpeg";
  const buffer = await source.arrayBuffer();

  const { upload_url, media_url } = await api<CreateUploadUrlResponse>(
    "/media/create-upload-url",
    { method: "POST" }
  );

  const put = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: buffer,
  });
  if (!put.ok) {
    const body = await put.text().catch(() => "");
    throw new Error(`Subida de imagen a Post for Me → ${put.status}\n${body}`);
  }
  return media_url;
}

export type CreateSocialPostInput = {
  caption: string;
  accountIds: string[];
  /** `media_url` ya devuelto por `uploadMedia`. Con más de uno sale carrusel. */
  mediaUrls: string[];
  scheduledAt: Date | null;
  platforms: SocialPlatform[];
  /** Ausente = feed (default de cada plataforma). */
  placement?: "stories";
};

export type SocialPostResult = {
  id: string;
  status: "draft" | "scheduled" | "processing" | "processed";
};

export async function createSocialPost(input: CreateSocialPostInput): Promise<SocialPostResult> {
  // Sin `placement` cada plataforma cae a su feed (nunca reels: esto son imágenes).
  const config = input.placement ? { placement: input.placement } : {};
  const platform_configurations: Record<string, object> = {};
  if (input.platforms.includes("facebook")) platform_configurations.facebook = { ...config };
  if (input.platforms.includes("instagram")) platform_configurations.instagram = { ...config };

  return api<SocialPostResult>("/social-posts", {
    method: "POST",
    body: JSON.stringify({
      caption: input.caption,
      social_accounts: input.accountIds,
      media: input.mediaUrls.map((url) => ({ url })),
      scheduled_at: input.scheduledAt ? input.scheduledAt.toISOString() : null,
      platform_configurations,
    }),
  });
}
