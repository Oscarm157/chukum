"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

interface MosaicPhoto {
  src: string;
  alt: string;
  label: string; // chip de zona
  restClassName: string; // posición de reposo (desktop)
  from: { x: number; y: number }; // de dónde entra
  rotate: number; // rotación en reposo
  delay: number; // stagger
}

// Fotos de desarrollos por zona (sin nombrar proyectos), alrededor de la imagen de
// estilo de vida. Comunican "hay opciones en distintas zonas".
const PHOTOS: MosaicPhoto[] = [
  {
    src: "/hero/ccm-foodtrucks.webp",
    alt: "Zona comercial de un desarrollo en el norte de Mérida",
    label: "Mérida",
    restClassName: "top-[6%] left-[3%] w-[25vw] min-w-[210px] aspect-[4/3]",
    from: { x: -320, y: 70 },
    rotate: -3,
    delay: 0.05,
  },
  {
    src: "/hero/xook-spa-xenotikal.webp",
    alt: "Casa club de un desarrollo en la selva de Yucatán",
    label: "Selva",
    restClassName: "bottom-[8%] left-[7%] w-[20vw] min-w-[170px] aspect-[4/5]",
    from: { x: -180, y: 240 },
    rotate: 2,
    delay: 0.16,
  },
  {
    src: "/hero/progreso-aereo.webp",
    alt: "Vista aérea de la costa de Progreso, Yucatán",
    label: "Costa",
    restClassName: "top-[9%] right-[4%] w-[24vw] min-w-[200px] aspect-[16/10]",
    from: { x: 320, y: -70 },
    rotate: 3,
    delay: 0.27,
  },
  {
    src: "/hero/ukana-pdc-gym.webp",
    alt: "Amenidad de un desarrollo de departamentos en el Caribe",
    label: "Caribe",
    restClassName: "bottom-[11%] right-[6%] w-[19vw] min-w-[160px] aspect-[3/4]",
    from: { x: 240, y: 210 },
    rotate: -2,
    delay: 0.38,
  },
];

const EASE = [0.16, 1, 0.3, 1] as const;

function Chip({ label }: { label: string }) {
  return (
    <span className="absolute bottom-2 left-2 rounded-full bg-espresso/70 px-3 py-1 text-xs text-crema backdrop-blur-sm">
      {label}
    </span>
  );
}

// Abanico de opciones: la imagen de estilo de vida al centro y 4 fotos de zona que ENTRAN
// volando desde fuera hacia su lugar (una sola vez, al entrar en viewport) y SE QUEDAN.
// No es una sección pineada, así que no desaparece al seguir haciendo scroll.
export function Mosaic({ heroSrc, heroAlt }: { heroSrc: string; heroAlt: string }) {
  const reduce = useReducedMotion();

  return (
    <section className="bg-canvas px-5 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-[1400px]">
        {/* Desktop: composición en abanico con entrada animada */}
        <div className="relative hidden h-[80vh] min-h-[560px] md:block">
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 1.05 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="absolute left-1/2 top-1/2 h-[64%] w-[46%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl"
          >
            <Image src={heroSrc} alt={heroAlt} fill className="object-cover" sizes="46vw" priority={false} />
          </motion.div>

          {PHOTOS.map((p) => (
            <motion.div
              key={p.src}
              initial={reduce ? false : { opacity: 0, x: p.from.x, y: p.from.y, rotate: p.rotate * 3 }}
              whileInView={{ opacity: 1, x: 0, y: 0, rotate: p.rotate }}
              viewport={{ once: true, margin: "-15% 0px" }}
              transition={{ duration: 0.7, delay: p.delay, ease: EASE }}
              className={`absolute overflow-hidden rounded-2xl shadow-[0_20px_50px_-24px_rgba(20,16,14,0.4)] ${p.restClassName}`}
            >
              <Image src={p.src} alt={p.alt} fill className="object-cover" sizes="25vw" />
              <Chip label={p.label} />
            </motion.div>
          ))}
        </div>

        {/* Mobile: grid estático (mismo material) */}
        <div className="grid grid-cols-2 gap-3 md:hidden">
          <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-3xl">
            <Image src={heroSrc} alt={heroAlt} fill className="object-cover" sizes="100vw" />
          </div>
          {PHOTOS.map((p) => (
            <div key={p.src} className="relative aspect-[4/3] overflow-hidden rounded-2xl">
              <Image src={p.src} alt={p.alt} fill className="object-cover" sizes="50vw" />
              <Chip label={p.label} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
