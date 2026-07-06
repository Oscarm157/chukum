// Gate de contrasena simple, sin base de datos. La cookie guarda el sha256 de
// KB_PASSWORD; el proxy de borde y el route handler comparan contra ese digest.
// Web Crypto funciona igual en el runtime Edge (proxy) y en Node (route handler).

export const KB_COOKIE = "kb_access";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Digest esperado en la cookie. null si no hay KB_PASSWORD configurada. */
export async function expectedToken(): Promise<string | null> {
  const pw = process.env.KB_PASSWORD;
  if (!pw) return null;
  return sha256Hex(pw);
}

/** Token para una contrasena enviada por el usuario. */
export async function tokenFor(password: string): Promise<string> {
  return sha256Hex(password);
}

/** Comparacion en tiempo constante sobre dos hex del mismo largo. */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
