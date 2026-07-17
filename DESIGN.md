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
  1. **Acento cromático: hoy no hay.** El sistema corre sin acento, solo crema / negro / grises. El
     ember-orange de Lightship (#fa5c40) nunca se sustituyó: el token que lo iba a reemplazar se
     declaró y jamás se usó en un solo pixel. Chukum define su acento en un proyecto de identidad
     aparte; hasta entonces este documento no inventa uno.
  2. **Overlay de hero:** Lightship pone el texto directo sobre la foto sin tinte. Aquí el hero usa
     video de cielo claro, donde sin tinte el nav y el headline no se leen, así que lleva gradiente
     arriba y abajo. Es la excepción justificada a la regla Lightship, no el default.

## Tema y atmósfera
Editorial, cálido, fotografía por delante del texto. Sobrio y sin acento cromático, no
"vende-humos inmobiliario" (nada de badges rojos de urgencia, nada de countdown, nada de collage
de logos de bancos).

## Paleta (roles semánticos, no solo hex)
- Fondo / superficies: crema cálido `#faf6ef` como canvas primario (evita el blanco frío de SaaS);
  blanco puro `#ffffff` solo para elevar cards/imagen sobre el crema.
- Texto (fuerte / suave / tenue): negro `#000000` (fuerte, texto primario y nav) / gris `#999999`
  (suave, cuerpo secundario) / gris claro `#d9d9d9` (tenue, hairlines y separadores en reposo).
- Acento: **no hay, y es a propósito.** El sistema se sostiene con crema, negro y grises. Cuando
  Chukum defina el suyo, entra con la disciplina de Lightship: solo wash/franja de highlight o
  estado de foco, nunca fondo de sección completa ni relleno de botón primario (no hay "botón
  primario" en este sistema, ver Componentes).
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
  (subrayado al hover) o chip tipo píldora (radio 100px, sin relleno ni borde). Cuando exista un
  acento, tampoco va como fondo de botón: rompería la disciplina "acento discreto" del reference lock.
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
- No inventarle un acento cromático a Chukum aquí. Va en su proyecto de identidad; hasta entonces
  el sistema corre sin acento, y eso no es un hueco que rellenar.
- Nada de urgencia falsa (countdowns, "solo quedan X") si no viene de un dato real verificado.

## Responsive
- Pendiente de definir en el piloto de la primera pantalla real — pantalla candidata: home o
  desarrollo Xo'ok (ya tiene contenido extraído). Se documenta aquí una vez construida y revisada.
