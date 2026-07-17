"use client";

import Image from "next/image";
import { Carousel } from "@/components/carousel";

interface ValueCard {
  title: string;
  body: string;
  image: string;
  alt: string;
}

export function ValuePropsCarousel({ items }: { items: readonly ValueCard[] }) {
  return (
    <Carousel
      items={items}
      ariaLabel="¿Por qué invertir en Yucatán?"
      renderItem={(v) => (
        <div className="relative aspect-[4/3] overflow-hidden rounded-[20px]">
          <Image src={v.image} alt={v.alt} fill className="object-cover" sizes="40vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
          <div className="absolute inset-x-6 bottom-6">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">¿Por qué invertir?</p>
            <h3 className="mt-1 text-2xl text-white">{v.title}</h3>
          </div>
          <a
            href="#top"
            aria-label={`Más sobre ${v.title}`}
            className="absolute bottom-6 right-6 flex h-9 w-9 items-center justify-center rounded-full border border-white/50 text-white transition hover:bg-white hover:text-obsidian"
          >
            +
          </a>
        </div>
      )}
    />
  );
}
