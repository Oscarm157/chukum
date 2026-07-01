@AGENTS.md

# Grupo-Orve

Sitio propio para promocionar propiedades (terrenos, casas, departamentos) de la
desarrolladora Grupo Orve. Bootstrap desde el starter de plomería design-agnóstico
de Oscar. Tier **Landing sin CRM**: no lleva panel /admin ni captura de leads.

## Reglas (heredan del CLAUDE.md global de Oscar)
- Seguridad de base: toda server action / route handler abre con `requireUser()`/`requireRole()`.
  Validar todo input con Zod (`src/lib/validate.ts`). Nunca confiar en IDs del cliente: cargarlos de DB.
- Estados por default: cada vista nace con loading / empty / error (`src/components/states.tsx`).
- Persistir estado del usuario; nada efímero que se pierda al recargar.
- Secrets solo en `.env.local`. Headers de seguridad ya van en `next.config.ts`.
- Endpoints caros / de IA: proteger con Vercel BotID (ver `src/app/api/expensive`).
- Git: commits chicos por feature, push frecuente; no saltar de tarea sin commitear.

## Diseño (bespoke por proyecto)
- El starter NO trae estética. Al iniciar la UI, llena `DESIGN.md` desde el reference lock de Refero
  y el agente lo lee para ser consistente. No copies DESIGN.md de marcas ajenas tal cual.

## Qué hay
- Auth por cookie firmada (PBKDF2 + HMAC) en `src/lib/auth.ts` + `src/lib/session.ts`
  (`requireUser`/`requireRole`/`requireAdmin`). Roles: admin/agent/viewer (se usan solo si
  vuelve a haber un panel protegido; hoy no hay ninguna ruta que los requiera).
- DB: Drizzle + Neon (`src/lib/db.ts`, `src/lib/schema.ts`), migraciones drizzle-kit, seed.
- Blob (`src/lib/blob.ts`), Resend (`src/lib/email.ts`), env validado (`src/lib/env.ts`).
- Sentry guardado por DSN, CI (tsc+lint+build), Playwright smoke con screenshot.

## Dominio: catálogo de propiedades
- `developments` (el proyecto/desarrollo, ej. Xo'ok) y `units` (unidad vendible: terreno/casa/
  depa, con precio y m2 reales) en `src/lib/schema.ts`. Campo `dataSource`/`verified` en ambas:
  todo lo que entra por scraping de `content/grupoorve-raw/` nace `grupoorve_scrape` /
  `verified: false`. Nunca confundir con datos reales confirmados por Oscar (Excel/PDF).
- `content/grupoorve-raw/`: copy e imágenes de referencia extraídos de grupoorve.com (material
  de referencia de marketing, NO catálogo/inventario real).
