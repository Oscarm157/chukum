/**
 * Edición de foto con Nano Banana (`google/nano-banana-2-lite`) en Replicate.
 * Server-only: lee `REPLICATE_API_TOKEN`, nunca se importa desde un componente cliente.
 *
 * Puerto de /root/clinica/src/lib/replicate.ts (mismo caso de uso, ya en producción),
 * recortado a la parte de imagen. Contrato confirmado contra el OpenAPI del modelo:
 * - `image_input` es un arreglo de imágenes. Se manda SIEMPRE como data URI base64 para
 *   no depender de que la foto sea alcanzable desde fuera (en local, `BRAND.url` apunta a
 *   un dominio que todavía no sirve el archivo nuevo).
 * - No se manda `aspect_ratio`: su default `match_input_image` es justo lo que se quiere,
 *   la proporción ya la decidió el recorte de la Fase 1.
 * - Este modelo NO tiene parámetro `resolution` (solo `nano-banana-2`/`-pro` lo tienen,
 *   enum 1K/2K/4K) — su única salida es un tier fijo ~1376x768, ni se incluye en el input.
 *
 * Por qué este modelo y no otro (probado en vivo, no elegido a ojo, 2026-08-03):
 * - `google/nano-banana` (estándar original): sin control de resolución, una foto de
 *   4000x2250 volvía editada en 1344x768 sin importar el tamaño de envío — pixelado real
 *   en posts publicados, la causa no era el tamaño de envío sino el techo del modelo.
 * - `google/nano-banana-2` con `resolution: "2K"`: resuelve la resolución (2752x1536),
 *   pero cuesta ~$0.10/edición en Replicate (casi igual al precio oficial directo de
 *   Google, no vale la pena migrar de proveedor) — le pega al margen del producto que
 *   Oscar quiere vender (paquetes de 75-120 generaciones).
 * - `google/nano-banana-2-lite`: mismo nivel de fidelidad que los anteriores (no inventa
 *   escena, preserva la foto original — verificado comparando contra el original real),
 *   1376x768 (de sobra para feed de Instagram/Facebook, que recomienda ~1080px),
 *   **$0.0336/edición** (~1/3 del costo de nano-banana-2) y ~5.6s (4-5x más rápido).
 *   Elegido como default. Si algún día hace falta más resolución para un caso puntual,
 *   la opción es `nano-banana-2` con `resolution: "2K"/"4K"` para esa sola edición.
 */

const API = "https://api.replicate.com/v1";
const MODELO = "google/nano-banana-2-lite";

// `Prefer: wait` deja la conexión abierta hasta ~60s. En la prueba real una generación
// tardó 102s, así que el polling cubre 90s más; el techo (~150s) cabe en el
// `maxDuration = 180` de las páginas que disparan la action.
const POLL_INTENTOS = 60;
const POLL_MS = 1500;

type Prediccion = {
  status: string;
  output?: unknown;
  error?: unknown;
  urls?: { get?: string };
};

function cabeceras(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

const TERMINALES = ["succeeded", "failed", "canceled"];

/** Crea la predicción esperando en línea y, si no alcanzó, hace polling hasta que termine. */
async function correrHastaElFinal(input: object): Promise<Prediccion | null> {
  const res = await fetch(`${API}/models/${MODELO}/predictions`, {
    method: "POST",
    headers: { ...cabeceras(), Prefer: "wait" },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) {
    console.error("[nanobanana] HTTP", res.status, (await res.text()).slice(0, 200));
    return null;
  }

  let pred: Prediccion = await res.json();
  const urlConsulta = pred.urls?.get;
  for (let i = 0; i < POLL_INTENTOS && !TERMINALES.includes(pred.status); i++) {
    if (!urlConsulta) break;
    await new Promise((r) => setTimeout(r, POLL_MS));
    const poll = await fetch(urlConsulta, { headers: cabeceras() });
    if (!poll.ok) break;
    pred = await poll.json();
  }
  return pred;
}

function primeraUrl(output: unknown): string | null {
  const o = Array.isArray(output) ? output[0] : output;
  return typeof o === "string" ? o : null;
}

/** Convierte la foto (URL absoluta o archivo aún sin subir) al data URI que pide el modelo. */
async function aDataUri(imagen: string | File): Promise<string> {
  if (imagen instanceof File) {
    const bytes = Buffer.from(await imagen.arrayBuffer());
    return `data:${imagen.type};base64,${bytes.toString("base64")}`;
  }
  const res = await fetch(imagen);
  if (!res.ok) throw new Error(`No se pudo leer la imagen original (HTTP ${res.status}).`);
  const tipo = res.headers.get("content-type") ?? "image/jpeg";
  if (!tipo.startsWith("image/")) throw new Error("Esa dirección no devolvió una imagen.");
  const bytes = Buffer.from(await res.arrayBuffer());
  return `data:${tipo};base64,${bytes.toString("base64")}`;
}

export async function editarFoto({
  imagen,
  prompt,
  usuario,
}: {
  /** URL absoluta de la foto ya guardada, o el archivo local que todavía no se sube. */
  imagen: string | File;
  prompt: string;
  usuario: string;
}): Promise<{ ok: true; resultUrl: string } | { error: string }> {
  if (!process.env.REPLICATE_API_TOKEN) {
    return { error: "Falta REPLICATE_API_TOKEN en el entorno." };
  }

  const inicio = Date.now();
  try {
    const dataUri = await aDataUri(imagen);

    const pred = await correrHastaElFinal({
      // El encuadre y el realismo se piden explícitos: sin eso el modelo tiende a
      // recomponer la foto. El texto se prohíbe a propósito, los títulos los pone el
      // overlay de plantillas, que sí controla la tipografía.
      prompt: `Edita esta fotografía: ${prompt}. Conserva el encuadre, la iluminación y el realismo fotográfico del original. No agregues texto, logotipos ni marcas de agua.`,
      image_input: [dataUri],
    });

    if (!pred || pred.status !== "succeeded") {
      const detalle = pred?.error ? String(pred.error).slice(0, 200) : `estado ${pred?.status ?? "sin respuesta"}`;
      console.error(
        JSON.stringify({
          evento: "contenido_edicion_ia_error",
          usuario,
          ms: Date.now() - inicio,
          error: detalle,
        })
      );
      return { error: `Replicate no terminó la edición: ${detalle}` };
    }

    const resultUrl = primeraUrl(pred.output);
    if (!resultUrl) {
      console.error(
        JSON.stringify({
          evento: "contenido_edicion_ia_error",
          usuario,
          ms: Date.now() - inicio,
          error: "salida sin URL",
        })
      );
      return { error: "Replicate terminó pero no devolvió una imagen." };
    }

    console.info(
      JSON.stringify({
        evento: "contenido_edicion_ia",
        usuario,
        ms: Date.now() - inicio,
        modelo: MODELO,
      })
    );
    return { ok: true, resultUrl };
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e);
    console.error(
      JSON.stringify({
        evento: "contenido_edicion_ia_error",
        usuario,
        ms: Date.now() - inicio,
        error: mensaje,
      })
    );
    return { error: mensaje };
  }
}
