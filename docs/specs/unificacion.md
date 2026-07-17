# Spec — Unificación del sitio (corporativo + vivir + campus) en un solo `main`

## Objetivo
Un solo sitio en `main` que reúne las dos "homes" que hoy viven en ramas separadas, más la sección
Campus. Sin `git merge` (historias sin raíz común, colisión en cada archivo): integración ordenada
sobre la rama `unificacion` (desde `main`), que al aprobarse se vuelve `main`.

## Fuente de verdad / arquitectura
- Base: `main` de Chukum (ya tiene `/campus` mergeado en `3c62d75`).
- Se traen las piezas de la rama `vivir-en-yucatan` (working dir `/root/vivir-en-yucatan`).
- Schema: se adopta el de vivir (superset: agrega `zonas` + `leads` + FK `zonaId`).
- DB: **la Neon de vivir** (ya tiene developments + zonas + leads + piloto). El sitio unificado
  apunta ahí. Revisar si al corporativo le falta algún dato y traerlo.

## Route map (decidido con Oscar)
- `/` → **redirect a `/inicio`**.
- `/inicio` → home **corporativa** (la actual `main` `src/app/page.tsx`), diseño verde corporativo.
- `/vivir-en-merida` → home **de vivir**, diseño terracota. Sus sub-rutas **anidadas**:
  - `/vivir-en-merida/zonas/[slug]`
  - `/vivir-en-merida/desarrollos/[slug]`
  - `/api/leads` (API, se queda en raíz) + `/api/expensive` si aplica.
- `/campus` → base de conocimientos (ya está, no se toca).

## Coexistencia de diseño (clave)
Dos sistemas en un mismo sitio, scopeados por wrapper de sección (mismo patrón que ya se usó en
`/campus`):
- Corporativo verde (DM Sans) → scopeado a `/inicio` (y layout raíz por defecto).
- Vivir terracota (Fraunces + Inter) → scopeado a `/vivir-en-merida` con su propio wrapper/layout.
- Campus (verde, serif) → ya scopeado en `.campus`.
Fuentes: cargar las familias necesarias en el layout raíz (o sub-layouts por sección). Tokens de cada
sistema namespaced para no pisarse; verificar por grep que ninguna sección filtra sus tokens a otra.

## Integración de código
- Componentes de vivir → `src/components/vivir/` (namespaced, evita colisión con los del corporativo:
  footer, json-ld, smooth-scroll, site-nav, etc.).
- Lib de vivir que falta en main → traer `queries.ts`, `seo.ts`, `site.ts`. Lib compartida (auth, db,
  session, blob, email, env, validate, motion, services, crm-format, utils) ya existe: no duplicar.
- `schema.ts` → adoptar el de vivir (superset). Migración drizzle-kit. `.env.local` DATABASE_URL → Neon de vivir.

## Plan de ejecución
1. **Piloto (estructura + coexistencia de diseño):** `/` redirect, mover home corporativa a `/inicio`,
   traer home de vivir a `/vivir-en-merida` con terracota scopeado. Verificar que AMBAS homes
   renderizan bien lado a lado (captura real). Revisar aquí antes de propagar.
2. **Propagar:** anidar `/vivir-en-merida/zonas` y `/desarrollos`, traer `/api/leads`, adoptar schema
   (zonas+leads) + queries/seo/site, apuntar a la Neon de vivir, migrar.
3. **Pase final:** `tsc` + `build` verdes, revisor-codigo/critico-anti-slop sobre el delta, capturas de
   las 3 secciones. Merge a `main` solo con ok de Oscar. Push/deploy piden confirmación.

## Criterios de aceptación
- `/` redirige a `/inicio`; `/inicio` = corporativo verde intacto; `/vivir-en-merida` = vivir terracota;
  `/campus` sigue igual. Cada diseño en su sección, sin filtrarse.
- `/vivir-en-merida/zonas/[slug]` y `/desarrollos/[slug]` funcionan (SSG desde la Neon de vivir).
- `tsc --noEmit` y `npm run build` limpios. Capturas reales de las 3 secciones.
