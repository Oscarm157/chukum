# DESIGN — Chukum V2 (landing/funnel)

Dirección de la home nueva (`/inicio`, scope `.chukum`). El home editorial anterior
quedó archivado en `/home-prototipo` y su dirección Lightship vive en `DESIGN.md`.

## Concepto
Anclado en el material **chukum**: el árbol yucateco cuya corteza da el estuco/recubrimiento
natural (el acabado mineral cálido de cenotes, muros y albercas de la península). La marca
firma con su propio material. No es terracota ni verde corporate: es **mineral cálido, mate,
con grano**, artesanal yucateco. El sitio se lee como una pared de chukum bien acabada.

## Paleta (neutrales cálidos 70-90%, UN acento)
| Token | Hex | Rol |
|---|---|---|
| `--canvas` (`bg-canvas`) | `#F4EFE6` | fondo base, encalado |
| `--surface` (`bg-surface`) | `#FBF7EF` | cards, superficie elevada |
| `--chukum` (`bg-chukum`) | `#B9A489` | superficie firma: bandas/cards de estuco |
| `--chukum-deep` (`bg-chukum-deep`) | `#8C7659` | estuco saturado, profundidad |
| `--espresso` (`bg-espresso`) | `#1E1A16` | banda oscura mineral |
| `--ink` (`text-ink`) | `#241E17` | texto primario (nunca negro puro) |
| `--ink-2` (`text-ink-2`) | `#6E6353` | texto secundario |
| `--hairline` (`border-hairline`) | `#E4DAC9` | líneas/bordes |
| `--crema` (`text-crema`) | `#F2E7D6` | texto sobre espresso |
| **`--cenote` (`bg/text-cenote`)** | **`#2E7D6B`** | **ACENTO ÚNICO: agua de cenote. Uso <10%.** |
| `--cenote-deep` | `#245F52` | hover/pressed del acento |

El acento cenote amarra con el value prop real "riqueza hídrica" (los cenotes de Yucatán).
Un solo acento; el resto es material. Nada de segundo acento ni gradientes de circo.

## Tipografía
- Display: **Fraunces** (`font-display`), humanista y orgánica, casa con el material.
- Cuerpo: **Inter** (`font-sans` dentro de `.chukum`).
- Titulares grandes, **descriptivos y planos** (anti-slop): "Encuentra tu desarrollo",
  "Desarrollos que comercializo", "Por qué invertir en Yucatán". Prohibido el titular con
  juego de palabras o eslogan de agencia. Sin em-dashes en copy.

## Material y textura
- Grano de estuco (`.chukum-grain`) sobre bandas y cards clave, no sobre todo. Es material,
  no "bordecito".
- Radios orgánicos moderados (`rounded-2xl`/`rounded-3xl`), no pill en todo.
- Bandas mate profundas (espresso) para respiros cinematográficos.

## Estructura (secciones hermanas, cada una layout DISTINTO — regla anti-plano)
Hero full-bleed → Quiz (una pregunta por pantalla) → Grid de desarrollos → Banda "Por qué
Yucatán" (espresso + grano) → Prueba/credibilidad → Contacto. Tres layouts iguales seguidos
se leen planos: variar a propósito (image-led, tipográfica, banda oscura, split asimétrico).

## Motion
Reveals con propósito (`motion/react`), respeta `prefers-reduced-motion`. El quiz transiciona
pregunta a pregunta; sin animación gratuita.

## Reglas duras de datos
- Solo datos reales: los 5 desarrollos (Xo'ok, Ciudad Central Mérida/Progreso, Ukana PdC,
  Tulum Ha) e imágenes de `public/hero`. Único precio real: Xo'ok (aparta $10k, enganche 25%).
- El quiz NUNCA muestra montos por desarrollo. El resto es "disponibilidad y precios bajo
  solicitud" (a propósito).
- Prohibido nombrar la marca corporativa del desarrollador (restricción legal); los
  desarrollos SÍ por su nombre propio.
