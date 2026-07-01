"use client";

import Image from "next/image";
import { Carousel } from "@/components/carousel";

interface Development {
  name: string;
  place: string;
  image: string;
  alt: string;
  href: string;
}

export function DevelopmentsCarousel({ items }: { items: readonly Development[] }) {
  return (
    <Carousel
      items={items}
      ariaLabel="Desarrollos de Grupo Orve"
      itemClassName="w-[82vw] md:w-[30%]"
      renderItem={(d) => (
        <a
          href={d.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block aspect-[4/5] overflow-hidden rounded-[20px]"
        >
          <Image
            src={d.image}
            alt={d.alt}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="32vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-x-6 bottom-6">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">{d.place}</p>
            <h3 className="mt-1 text-2xl text-white">{d.name}</h3>
          </div>
        </a>
      )}
    />
  );
}
