import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

// Security headers por default (regla del starter: seguridad de base, no al final).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Preview de `next dev` por IP del VPS: Next 16 bloquea el origen cruzado de los assets de
  // dev; declarar el IP aquí lo permite (solo afecta a desarrollo, no a producción).
  allowedDevOrigins: ["161.97.87.16"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// Envuelve la config con BotID preservando headers y poweredByHeader existentes.
export default withBotId(nextConfig);
