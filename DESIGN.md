# DESIGN.md — Vivir en Yucatán / Live Yucatán

Contrato de diseño. El agente de UI lo lee para ser consistente entre pantallas. NO improvisar
por página. Validar SIEMPRE con captura real (Playwright, build de prod). Anti-slop es ley.

## Norte / mood
Editorial cálido yucateco. Habitabilidad premium anclada en lo local: piedra caliza de Mérida
(sascab), sol, terracota colonial, selva/cenote. Debe leer como **revista de autoridad**, no como
portal de listings tipo Inmuebles24. Calma, fotografía protagonista, tipografía grande y fina.

## Reference lock (decision ledger — cada decisión trazada)
- **Primaria — Samara (samara.com):** lienzo pergamino cálido, tinta casi negra, titulares display
  finos y enormes, fotografía residencial soleada, banda hero oscura, ritmo de folleto premium
  hecho digital, tarjetas arena con radio suave. → mood general, densidad, canvas.
- **Prestado 1 — Aspelin Reitan (aspelineiendom.no):** bandas oscuras cinematográficas full-bleed
  con foto arquitectónica y un acento cálido. → de aquí la PROFUNDIDAD (hero + banda "por qué el
  norte"), para no caer en grid de tarjetas planas.
- **Prestado 2 — Kinfolk / The New Yorker:** editorial serif para las guías/pilares. → autoridad
  de magazine (sin sobre-estilizar el look Kinfolk; calidez sobre frialdad literaria).
- **Patrón ficha — Trulia property-detail:** hero dos columnas (galería + specs sidebar sticky).
- **Patrón zona — PamPam/Trulia neighborhood:** mapa + stats + narrativa.
- **Terracota + limestone:** decisión local (Mérida colonial/sascab), NO de referencia ajena.

## Paleta (roles, no decoración)
Modo claro (default). Tokens en `globals.css` `@theme`, reemplazan los de Orve (cream/verde).
- `--canvas` #F7F1E7 — pergamino/sascab, fondo base
- `--surface` #FFFFFF / `--surface-warm` #FCF8F1 — tarjetas/superficies elevadas
- `--ink` #1C1815 — texto primario (casi negro cálido)
- `--ink-2` #6B6258 — texto secundario (piedra)
- `--hairline` #E4DAC9 — líneas/bordes finos
- `--terracota` #B5502E — ACENTO ÚNICO. Eyebrows, links activos, subrayados, números clave,
  íconos. NO relleno masivo de botones.
- `--terracota-deep` #8F3D20 — hover/énfasis
- Banda oscura cinematográfica: `--espresso` #17120E fondo, `--crema` #F2E7D6 texto, acento
  terracota sobre foto full-bleed.
- **PROHIBIDO verde como acento** (confunde con Grupo Orve, marca de la que nos diferenciamos).

## Tipografía
- Display: **Fraunces** (variable, óptica, alto contraste, cálida) — titulares. Peso ligero a
  medio, tracking apretado en tamaños grandes (-0.02em desde 48px). Hasta 72-96px.
- UI/body: **Inter** — cuerpo 16-18px, line-height generoso (1.6). Specs/labels en mayúsculas
  discretas con tracking amplio para eyebrows.
- Números/precios: **Geist Mono** (tabular) para specs, m², precios, stats.
- Reemplazar el DM Sans actual del layout por Fraunces (display) + Inter (body). Mono se queda.

## Familias de layout (cada sección hermana DISTINTA — nunca 3 grids iguales)
1. **Hero:** foto full-bleed cinematográfica de Yucatán + titular Fraunces enorme y fino sobre
   gradiente oscuro. Nav transparente encima. Parallax sutil.
2. **Banda "Por qué el norte / Yucatán":** banda oscura espresso, foto full-bleed, 3-4 stats en
   terracota (seguridad, plusvalía, crecimiento) con número mono grande.
3. **Índice de zonas:** image-led, NO grid uniforme. Una zona líder grande (imagen dominante) +
   lista editorial de las demás. Cada item enlaza a /zonas/[slug].
4. **Ficha de desarrollo:** dos columnas (galería izquierda grande + panel specs sticky derecha,
   specs en mono). Amenidades como lista con hairlines. CTA WhatsApp + form.
5. **Guías/pilares:** filas editoriales serif tipo New Yorker (título serif grande, dek, imagen
   lateral). Fase posterior, pero el layout ya queda definido.
6. **Cierre/contacto:** cálido, simple. Form + botón WhatsApp contextual.

## Componentes
- **Botones:** ghost/outline, radio pill. Primario = borde ink o texto terracota; NADA de relleno
  terracota grande. Inputs tipo pill.
- **Cards:** cambio de superficie + radio ~16px, sin sombra pesada; hairline sutil.
- **Nav:** 3 zonas, transparente sobre hero → limestone al hacer scroll (reusar patrón site-nav).
- **Motion:** reusar `reveal.tsx` (scroll fade+slide), Lenis ya activo. Respetar
  `prefers-reduced-motion` SIEMPRE (fallback estático).

## Guardrails anti-slop (bloqueantes)
- Data real o marcada `verified:false`; NUNCA inventar precios, m², plusvalía, testimonios.
- Sin em-dashes en copy. Sin frases huecas ("transforma tu vida", "solución integral", "sin
  fricciones"). Copy factual con datos/nombres reales.
- Sin stock genérico obvio; fotografía real de Yucatán o del desarrollo.
- Verde prohibido (ver paleta).
- No repetir la misma familia de layout en secciones hermanas.
- No usar copy reciclado con errores de Orve (ej. el bloque de un desarrollo que menciona otro).

## SEO/i18n (recordatorio para el que maqueta)
- `generateMetadata` por página (canonical, OG). JSON-LD en `lib/seo.ts`. sitemap dinámico.
- ES primero. EN + hreflang después (columnas `descripcionEn`/`descriptionEn` ya existen).
- URLs limpias: `/zonas/[slug]`, `/desarrollos/[slug]`, `/guias/[slug]`.

## Datos del piloto (fuente de verdad hoy)
- Zona piloto: **Mérida Norte** (corredor periférico de crecimiento; keyword "casas/terrenos en
  venta al norte de mérida", KD 15). Publicada porque tiene desarrollo colgado.
- Desarrollo piloto: **Ciudad Central Mérida** (terrenos/townhouses/departamentos, preventa).
  Precio/m²/ubicación exacta = `verified:false` (Orve no los publica; llegan de Oscar/SharePoint).
- Imágenes reales disponibles: `public/desarrollos/ciudad-central-merida/casa-club.jpg` (foto) y
  `masterplan.jpg`. Falta material distintivo de mayor calidad (SharePoint, fase aparte).
