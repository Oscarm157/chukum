# DESIGN.md — dirección visual del proyecto

Este archivo congela la dirección de diseño para que el agente sea consistente en todas las
pantallas. Se llena AL INICIAR la UI, desde el reference lock de Refero (referencia primaria +
1-2 detalles prestados). No copiar el DESIGN.md de otra marca tal cual: referencia, no plantilla.
El starter llega en blanco a propósito; el diseño es bespoke por proyecto.

## Reference lock (de Refero)
- Referencia primaria: **Lightship** (lightshiprv.com, vía styles.refero.design). Sistema editorial
  photography-first: fotografía cinematográfica full-bleed, tipografía display apretada, casi
  monocromático con un solo acento. Encaja con real estate porque el producto (los desarrollos) se
  vende con fotografía/narrativa, no con UI — mismo principio que Lightship vende el tráiler con
  paisaje, no con chrome de producto. El copy de Xo'ok (cenotes, selva maya, santuario) pide
  exactamente este tratamiento editorial en vez de un layout de "tarjetas de propiedad" genérico.
- Detalles prestados:
  1. **Acento cromático:** se reemplaza el ember-orange de Lightship (#fa5c40) por el **verde real
     de Orve** (~#3FCF30, muestreado del botón "Conoce Más" en grupoorve.com — no hay manual de
     marca con hex oficial todavía). Misma disciplina que el naranja original: solo washes/strips
     pequeños, nunca relleno grande de botón.
  2. **Overlay de hero:** Lightship pone el texto directo sobre la foto sin tinte. Orve en su sitio
     actual usa overlay oscuro sobre foto para legibilidad. Se prueba primero sin overlay (regla
     Lightship) y solo se agrega tinte si en la foto real de un desarrollo el texto no se lee.

## Tema y atmósfera
Editorial, cálido, fotografía por delante del texto. Sobrio con un acento verde medido — no
"vende-humos inmobiliario" (nada de badges rojos de urgencia, nada de countdown, nada de collage
de logos de bancos).

## Paleta (roles semánticos, no solo hex)
- Fondo / superficies: crema cálido `#faf6ef` como canvas primario (evita el blanco frío de SaaS);
  blanco puro `#ffffff` solo para elevar cards/imagen sobre el crema.
- Texto (fuerte / suave / tenue): negro `#000000` (fuerte, texto primario y nav) / gris `#999999`
  (suave, cuerpo secundario) / gris claro `#d9d9d9` (tenue, hairlines y separadores en reposo).
- Acento (y cuándo se usa, con disciplina): verde Orve `~#3FCF30` (a confirmar hex oficial) — solo
  como wash/franja de highlight o estado de foco. Nunca como fondo de sección completa ni relleno
  de botón primario (no hay "botón primario" en este sistema, ver Componentes).
- Bordes / líneas: `#d9d9d9` hairline 1px en reposo, pasa a `#000000` en foco.
- Estados (éxito / aviso / error): no definidos — este tier landing no tiene flujos transaccionales
  todavía (sin CRM). Se definen cuando exista un formulario real que los necesite.

## Tipografía
- Display / títulos: sans geométrica (F37Bolton en el original; sustituto real: DM Sans o Inter,
  eligiendo el corte más geométrico/no-humanista disponible). Peso 700 solo en display y wordmark.
- Cuerpo: misma familia, peso 400.
- Escala y pesos: escala Minor Third desde 16px base — 72/75px (display), 48px (heading-lg), 34px
  (heading), 24px (heading-sm), 22px (subheading), 20px (body-lg), 16px (body), 14px (body-sm),
  12px (caption). Tracking apretado: -0.05em en 48px+, -0.03em en 34px y menos.
- Números (tabulares si hay datos): pendiente — se define cuando haya precios/m2 reales de
  `units` en pantalla (no antes, para no formatear datos que hoy son `verified: false`).

## Componentes
- Botones (primario / secundario / ghost): **sin botones rellenos.** Todo es texto tipo ghost-link
  (subrayado al hover) o chip tipo píldora (radio 100px, sin relleno ni borde). El verde de Orve no
  se usa como fondo de botón — rompería la disciplina "acento discreto" del reference lock.
- Inputs / formularios: píldora, radio 100px, borde 1px `#d9d9d9` en reposo → `#000000` en foco,
  relleno crema o blanco, padding horizontal generoso (20px).
- Cards / contenedores (elevación por capa o por sombra): sin sombras. Elevación = cambio de
  superficie (crema → blanco) + radio 20px, nunca `box-shadow`.
- Navegación: barra de 3 zonas (menú + links / wordmark centrado / links utilitarios), transparente
  sobre el hero, sin fondo. Texto blanco sobre foto, negro sobre crema.

## Layout y espaciado
- Anchos máximos, grid, ritmo vertical: max-width 1440px para contenido; hero y quiebres de sección
  pueden ir full-bleed (100vw). Gap entre secciones: 100px. Mosaico de fotos **asimétrico** (no
  grid parejo de N columnas iguales) — offsets verticales variables, como en Lightship.
- Densidad (compacto / aireado): aireado — 100px entre secciones, 24px padding de card, 16px gap
  entre elementos.

## Motion
- Reveal por scroll en el mosaico de fotos: las imágenes entran/asientan en su posición conforme
  aparecen en viewport (visto en Lightship al hacer scroll). Hero con imagen grande que puede
  "perforar" un titular display gigante en el primer quiebre de sección. Siempre con
  `prefers-reduced-motion` respetado (fallback: aparecen ya en posición final, sin animar).

## Guardrails (qué NO hacer)
- No inventar fotos de stock genéricas para rellenar huecos — usar el material real (piloto Xo'ok
  en `content/grupoorve-raw/`, o SharePoint cuando esté disponible) o dejar el espacio pendiente.
- No mostrar precios, m2 ni disponibilidad de `units` con `verified: false` como si fueran dato
  confirmado — son borrador de scraping, marcarlos como tal si llegan a mostrarse antes de tener
  el Excel/PDF real cargado.
- No usar el copy reciclado con errores detectado en el piloto (ej. el bloque de Xo'ok que dice
  "Ciudad Central Progreso") — revisar cada desarrollo contra su propio contenido antes de publicar.
- No usar el verde de Orve como fondo grande de sección ni relleno de botón — rompe la disciplina
  de acento discreto heredada de Lightship.
- Nada de urgencia falsa (countdowns, "solo quedan X") si no viene de un dato real verificado.

## Responsive
- Pendiente de definir en el piloto de la primera pantalla real — pantalla candidata: home o
  desarrollo Xo'ok (ya tiene contenido extraído). Se documenta aquí una vez construida y revisada.
