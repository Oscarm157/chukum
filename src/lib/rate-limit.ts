// Rate limit best-effort por instancia serverless (mismo criterio que /api/leads).
// No es durable entre instancias; es una primera barrera anti-abuso, no un límite exacto.
export function makeRateLimiter(windowMs: number, max: number) {
  const hits = new Map<string, number[]>();
  return function rateLimited(key: string): boolean {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    if (recent.length === 0) hits.delete(key);
    else hits.set(key, recent);
    return recent.length > max;
  };
}
