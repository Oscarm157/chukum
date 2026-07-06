"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  // Amplitud del desplazamiento en px (el interior es más alto que el marco).
  amount?: number;
};

// Imagen con parallax sutil al hacer scroll. Respeta prefers-reduced-motion:
// si está activo, queda estática y encuadrada. El contenedor define la altura.
export function ParallaxImage({
  src,
  alt,
  priority,
  sizes = "100vw",
  className = "",
  amount = 60,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-amount, amount]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        style={reduce ? undefined : { y }}
        className="absolute inset-0"
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className="scale-110 object-cover"
        />
      </motion.div>
    </div>
  );
}
