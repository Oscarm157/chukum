"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

interface MosaicPhoto {
  src: string;
  alt: string;
  /** posición de reposo (Tailwind classes: top/left/right/bottom + width) */
  restClassName: string;
  /** de dónde entra: desplazamiento inicial en px */
  from: { x: number; y: number };
  /** rango de scrollYProgress en el que entra (stagger) */
  enter: [number, number];
  rotateFrom: number;
  rotateTo: number;
}

const PHOTOS: MosaicPhoto[] = [
  {
    src: "/hero/orve-merida-plaza-grande.webp",
    alt: "Vista aérea de la Plaza Grande y la catedral de Mérida, Yucatán",
    restClassName: "top-[7%] left-[3%] w-[26vw] min-w-[220px] aspect-[4/3]",
    from: { x: -340, y: 90 },
    enter: [0.15, 0.45],
    rotateFrom: -9,
    rotateTo: -4,
  },
  {
    src: "/hero/orve-cenote.webp",
    alt: "Cenote en la selva de Yucatán",
    restClassName: "bottom-[9%] left-[10%] w-[19vw] min-w-[160px] aspect-[4/5]",
    from: { x: -160, y: 260 },
    enter: [0.25, 0.55],
    rotateFrom: 7,
    rotateTo: 3,
  },
  {
    src: "/hero/xook-spa-xenotikal.webp",
    alt: "Casa club Xenotikal, desarrollo Xo'ok",
    restClassName: "top-[10%] right-[5%] w-[23vw] min-w-[200px] aspect-[16/11]",
    from: { x: 320, y: -80 },
    enter: [0.35, 0.65],
    rotateFrom: 8,
    rotateTo: 5,
  },
  {
    src: "/hero/orve-familia-playa.webp",
    alt: "Familia en la playa de Yucatán",
    restClassName: "bottom-[12%] right-[7%] w-[17vw] min-w-[150px] aspect-[3/4]",
    from: { x: 220, y: 240 },
    enter: [0.45, 0.75],
    rotateFrom: -6,
    rotateTo: -2,
  },
];

function MosaicPhotoItem({ photo, scrollYProgress }: { photo: MosaicPhoto; scrollYProgress: import("motion/react").MotionValue<number> }) {
  const x = useTransform(scrollYProgress, photo.enter, [photo.from.x, 0]);
  const y = useTransform(scrollYProgress, photo.enter, [photo.from.y, 0]);
  const opacity = useTransform(scrollYProgress, [photo.enter[0], photo.enter[0] + 0.12], [0, 1]);
  const rotate = useTransform(scrollYProgress, photo.enter, [photo.rotateFrom, photo.rotateTo]);

  return (
    <motion.div
      style={{ x, y, opacity, rotate }}
      className={`absolute overflow-hidden rounded-[20px] shadow-none ${photo.restClassName}`}
    >
      <Image src={photo.src} alt={photo.alt} fill className="object-cover" sizes="26vw" />
    </motion.div>
  );
}

export function PinnedMosaic({ heroSrc, heroAlt }: { heroSrc: string; heroAlt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const heroScale = useTransform(scrollYProgress, [0, 0.35], [1, 0.56]);
  const heroRadius = useTransform(scrollYProgress, [0, 0.35], [0, 20]);

  if (reduceMotion) {
    return (
      <section className="relative mx-auto max-w-[1440px] px-6 py-24 md:px-10 md:py-[100px]">
        <div className="relative mx-auto aspect-[16/9] max-w-3xl overflow-hidden rounded-[20px]">
          <Image src={heroSrc} alt={heroAlt} fill className="object-cover" />
        </div>
        <div className="relative mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {PHOTOS.map((p) => (
            <div key={p.src} className="relative aspect-[4/3] overflow-hidden rounded-[20px]">
              <Image src={p.src} alt={p.alt} fill className="object-cover" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[280vh] bg-cream">
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        <motion.div
          style={{ scale: heroScale, borderRadius: heroRadius }}
          className="absolute inset-0 origin-center overflow-hidden"
        >
          <Image src={heroSrc} alt={heroAlt} fill className="object-cover" priority={false} sizes="100vw" />
        </motion.div>
        {PHOTOS.map((p) => (
          <MosaicPhotoItem key={p.src} photo={p} scrollYProgress={scrollYProgress} />
        ))}
      </div>
    </section>
  );
}
