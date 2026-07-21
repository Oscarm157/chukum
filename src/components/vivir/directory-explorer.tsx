"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Map as MlMap, Marker } from "maplibre-gl";
import { Star } from "lucide-react";
import { CATEGORIES } from "@/lib/directory/filters";
import type { RankedPlace, SampleZona } from "@/lib/directory/sample-data";
import type { PlaceCategory } from "@/lib/schema-directory";

// Estilo base minimal (OpenFreeMap positron, gratis). Se recolorea a la paleta .vivir en load()
// para que el mapa se lea como cartografía DISEÑADA de Mérida, no como Google Maps.
const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

// Recolorea el estilo base a la paleta .vivir: tierra pergamino, agua/vías en tinta cálida muteada,
// etiquetas en tinta. Convierte el mapa genérico en cartografía de marca. Robusto al nombre de capa.
function recolorMap(map: MlMap) {
  const layers = map.getStyle().layers ?? [];
  for (const layer of layers) {
    const id = layer.id;
    try {
      if (layer.type === "background") {
        map.setPaintProperty(id, "background-color", "#efe7d6");
      } else if (layer.type === "fill") {
        map.setPaintProperty(id, "fill-color", /water|ocean|sea|river|lake/i.test(id) ? "#dacdb6" : "#e9e0cf");
      } else if (layer.type === "line") {
        map.setPaintProperty(id, "line-color", /water|river/i.test(id) ? "#cdbfa4" : "#dccdb2");
      } else if (layer.type === "symbol") {
        map.setPaintProperty(id, "text-color", "#6b6258");
        map.setPaintProperty(id, "text-halo-color", "#f7f1e7");
        map.setPaintProperty(id, "text-halo-width", 1.2);
      }
    } catch {
      // capa sin esa propiedad: se ignora
    }
  }
}

type Props = {
  places: RankedPlace[];
  zonas: SampleZona[];
  soloCategorias?: PlaceCategory[];
};

export function DirectoryExplorer({ places, zonas, soloCategorias }: Props) {
  const [categoria, setCategoria] = useState<PlaceCategory | null>(null);
  const [zona, setZona] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const categoriasDisponibles = useMemo(() => {
    const presentes = new Set(places.map((p) => p.category));
    return CATEGORIES.filter(
      (c) => presentes.has(c.value) && (!soloCategorias || soloCategorias.includes(c.value))
    );
  }, [places, soloCategorias]);

  const filtradas = useMemo(() => {
    return places
      .filter((p) => !soloCategorias || soloCategorias.includes(p.category))
      .filter((p) => (categoria ? p.category === categoria : true))
      .filter((p) => (zona ? p.zonaSlug === zona : true))
      .sort((a, b) => b.rankScore - a.rankScore);
  }, [places, categoria, zona, soloCategorias]);

  const zonaDe = (slug: string) => zonas.find((z) => z.slug === slug);

  // --- Mapa ---
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const markerEls = useRef<Map<string, HTMLElement>>(new Map());
  const didFit = useRef(false);
  const [ready, setReady] = useState(false);
  const mlRef = useRef<typeof import("maplibre-gl") | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const maplibregl = await import("maplibre-gl");
      if (cancelled || !mapContainer.current || mapRef.current) return;
      mlRef.current = maplibregl;
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: MAP_STYLE,
        center: [-89.617, 20.99],
        zoom: 11.6,
        attributionControl: { compact: true },
        // El scroll de la página pasa por encima del mapa sin hacer zoom (zoom con ctrl+rueda o
        // los botones). Evita que el mapa "atrape" el scroll y se sienta activo.
        cooperativeGestures: true,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;

      map.on("load", () => {
        recolorMap(map);
        for (const z of zonas) {
          const src = `zona-${z.slug}`;
          map.addSource(src, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "Polygon", coordinates: [z.polygon] },
            },
          });
          map.addLayer({
            id: `${src}-fill`,
            type: "fill",
            source: src,
            paint: { "fill-color": z.color, "fill-opacity": 0.1 },
          });
          map.addLayer({
            id: `${src}-line`,
            type: "line",
            source: src,
            paint: { "line-color": z.color, "line-width": 1.25, "line-opacity": 0.55, "line-dasharray": [2, 1.5] },
          });
          map.on("click", `${src}-fill`, () => setZona((prev) => (prev === z.slug ? null : z.slug)));
          map.on("mouseenter", `${src}-fill`, () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", `${src}-fill`, () => (map.getCanvas().style.cursor = ""));
        }
        setReady(true);
      });
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resalta la zona activa.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const z of zonas) {
      const active = zona === z.slug;
      map.setPaintProperty(`zona-${z.slug}-fill`, "fill-opacity", active ? 0.22 : zona ? 0.05 : 0.1);
      map.setPaintProperty(`zona-${z.slug}-line`, "line-width", active ? 2.25 : 1.25);
    }
  }, [zona, ready, zonas]);

  // Marcadores numerados (el número = posición en el ranking filtrado).
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = mlRef.current;
    if (!map || !maplibregl || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();
    markerEls.current.clear();

    filtradas.forEach((p, i) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "vivir-pin-num";
      el.textContent = String(i + 1);
      el.setAttribute("aria-label", `${i + 1}. ${p.nombre}`);
      el.addEventListener("mouseenter", () => setHover(p.slug));
      el.addEventListener("mouseleave", () => setHover(null));
      el.addEventListener("click", () => {
        document.getElementById(`place-${p.slug}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        setHover(p.slug);
      });
      const marker = new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map);
      markersRef.current.set(p.slug, marker);
      markerEls.current.set(p.slug, el);
    });

    // Encuadre una sola vez, al primer render de marcadores. Al filtrar, los pines aparecen o
    // desaparecen pero el mapa NO salta: se queda quieto.
    if (filtradas.length > 0 && !didFit.current) {
      const bounds = new maplibregl.LngLatBounds();
      filtradas.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: 80, maxZoom: 14.5, duration: 0 });
      didFit.current = true;
    }
  }, [filtradas, ready]);

  // Resalta el pin de la tarjeta con hover. El mapa NO se mueve: solo se marca el pin.
  useEffect(() => {
    markerEls.current.forEach((el, slug) => {
      el.classList.toggle("is-active", slug === hover);
    });
  }, [hover]);

  const hayFiltro = categoria !== null || zona !== null;
  const featured = filtradas[0];
  const resto = filtradas.slice(1);

  return (
    <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      {/* Lista/tarjetas: derecha en desktop, debajo del mapa en mobile */}
      <div className="order-2">
        {/* Filtros */}
        <div className="sticky top-0 z-10 border-y border-hairline bg-canvas/95 px-6 py-4 backdrop-blur md:px-10">
          <div className="flex flex-wrap items-center gap-2">
            <FilterPill active={categoria === null} onClick={() => setCategoria(null)}>
              Todo
            </FilterPill>
            {categoriasDisponibles.map((c) => (
              <FilterPill
                key={c.value}
                active={categoria === c.value}
                onClick={() => setCategoria((prev) => (prev === c.value ? null : c.value))}
              >
                {c.label}
              </FilterPill>
            ))}
            <span className="mx-1 h-4 w-px bg-hairline" />
            {zonas.map((z) => (
              <FilterPill
                key={z.slug}
                active={zona === z.slug}
                onClick={() => setZona((prev) => (prev === z.slug ? null : z.slug))}
                dot={z.color}
              >
                {z.nombre}
              </FilterPill>
            ))}
            {hayFiltro && (
              <button
                onClick={() => {
                  setCategoria(null);
                  setZona(null);
                }}
                className="ml-1 text-xs text-terracota underline underline-offset-2"
              >
                Limpiar
              </button>
            )}
          </div>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
            {filtradas.length} {filtradas.length === 1 ? "lugar" : "lugares"} · datos de Google
          </p>
        </div>

        <div className="px-6 pb-16 md:px-10">
          {featured && (
            <FeaturedEntry
              place={featured}
              zona={zonaDe(featured.zonaSlug)}
              hovered={hover === featured.slug}
              onHover={() => setHover(featured.slug)}
              onLeave={() => setHover(null)}
            />
          )}

          <ol className="mt-2">
            {resto.map((p, i) => (
              <PlaceRow
                key={p.slug}
                place={p}
                rank={i + 2}
                zona={zonaDe(p.zonaSlug)}
                hovered={hover === p.slug}
                onHover={() => setHover(p.slug)}
                onLeave={() => setHover(null)}
              />
            ))}
          </ol>

          {filtradas.length === 0 && (
            <p className="py-20 text-center text-ink-2">
              No hay lugares con esos filtros.{" "}
              <button
                onClick={() => {
                  setCategoria(null);
                  setZona(null);
                }}
                className="text-terracota underline underline-offset-2"
              >
                Limpiar filtros
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Mapa de marca: izquierda en desktop (sticky), banda arriba en mobile */}
      <div className="order-1 lg:sticky lg:top-0 lg:h-[100dvh]">
        <div ref={mapContainer} className="h-[42vh] w-full lg:h-full" />
      </div>
    </div>
  );
}

/* ---------- Foto del lugar: imagen real o panel tipográfico (aún sin Outscraper) ---------- */
function PlaceImage({
  place,
  zona,
  rank,
  className,
  numberClass,
}: {
  place: RankedPlace;
  zona?: SampleZona;
  rank: number;
  className?: string;
  numberClass?: string;
}) {
  const label = CATEGORIES.find((c) => c.value === place.category)?.label ?? place.category;
  if (place.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={place.imageUrl} alt={place.nombre} className={`object-cover ${className ?? ""}`} />;
  }
  const color = zona?.color ?? "#b5502e";
  return (
    <div
      className={`relative flex items-end overflow-hidden ${className ?? ""}`}
      style={{ background: `linear-gradient(150deg, ${color}1f, ${color}0a 60%, transparent)` }}
      aria-hidden
    >
      <span
        className={`pointer-events-none absolute -right-1 -top-3 font-display leading-none text-ink/[0.06] ${
          numberClass ?? "text-[7rem]"
        }`}
      >
        {String(rank).padStart(2, "0")}
      </span>
      <span className="relative m-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2">
        {label}
      </span>
    </div>
  );
}

// Lo principal del directorio: calificación, número de reseñas y precio, en grande. La foto importa,
// pero el dato de Google es lo que la gente busca primero. `size="lg"` para el destacado.
function Rating({ place, size = "md" }: { place: RankedPlace; size?: "md" | "lg" }) {
  const big = size === "lg";
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex items-baseline gap-1.5">
        <Star
          className={`${big ? "h-6 w-6" : "h-[17px] w-[17px]"} shrink-0 translate-y-0.5 fill-terracota text-terracota`}
        />
        <span
          className={`font-display leading-none tabular-nums text-ink ${big ? "text-4xl md:text-5xl" : "text-2xl"}`}
        >
          {place.rating.toFixed(1)}
        </span>
      </span>
      <span className={`w-px self-stretch bg-hairline ${big ? "my-1" : ""}`} />
      <span className={`leading-tight text-ink-2 ${big ? "text-sm" : "text-xs"}`}>
        <span className="block tabular-nums text-ink">
          {place.reviewsCount.toLocaleString("es-MX")} reseñas
        </span>
        <span className="block">
          <span className="tabular-nums">{"$".repeat(place.priceLevel)}</span> · datos de Google
        </span>
      </span>
    </div>
  );
}

function ZonaTag({ zona }: { zona?: SampleZona }) {
  if (!zona) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: zona.color }} />
      {zona.nombre}
    </span>
  );
}

/* ---------- Galería (top 10): imagen principal + tira de miniaturas ---------- */
function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt={alt} className="h-full w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="mt-2 flex gap-2">
          {images.slice(0, 5).map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Foto ${i + 1} de ${alt}`}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border transition md:h-16 md:w-24 ${
                active === i ? "border-terracota" : "border-hairline opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Entrada destacada (#1) ---------- */
function FeaturedEntry({
  place,
  zona,
  hovered,
  onHover,
  onLeave,
}: {
  place: RankedPlace;
  zona?: SampleZona;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <article
      id={`place-${place.slug}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`scroll-mt-40 border-b border-hairline pb-10 pt-8 transition-colors ${
        hovered ? "bg-surface-warm" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="font-display text-5xl leading-none text-terracota">01</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">
          Lo mejor ahora
        </span>
      </div>
      <div className="mt-5">
        {place.gallery && place.gallery.length > 0 ? (
          <Gallery images={place.gallery} alt={place.nombre} />
        ) : (
          <PlaceImage place={place} zona={zona} rank={1} className="aspect-[16/9] w-full rounded-2xl" numberClass="text-[12rem]" />
        )}
      </div>
      <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-display text-3xl tracking-[-0.02em] text-ink md:text-4xl">
          <Link href={`/vivir-en-merida/directorio/${place.slug}`} className="transition hover:text-terracota">
            {place.nombre}
          </Link>
        </h3>
        <ZonaTag zona={zona} />
      </div>
      <div className="mt-4">
        <Rating place={place} size="lg" />
      </div>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-2">{place.editorialNote}</p>
    </article>
  );
}

/* ---------- Fila editorial (resto) ---------- */
function PlaceRow({
  place,
  rank,
  zona,
  hovered,
  onHover,
  onLeave,
}: {
  place: RankedPlace;
  rank: number;
  zona?: SampleZona;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <li
      id={`place-${place.slug}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`grid scroll-mt-40 grid-cols-[132px_1fr] items-stretch gap-5 border-b border-hairline py-6 transition-colors ${
        hovered ? "bg-surface-warm" : ""
      }`}
    >
      <PlaceImage place={place} zona={zona} rank={rank} className="aspect-square w-full rounded-xl" numberClass="text-6xl" />
      <div className="min-w-0">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-xl leading-none text-terracota tabular-nums">
            {String(rank).padStart(2, "0")}
          </span>
          <h3 className="font-display text-xl tracking-[-0.01em] text-ink">
            <Link href={`/vivir-en-merida/directorio/${place.slug}`} className="transition hover:text-terracota">
              {place.nombre}
            </Link>
          </h3>
        </div>
        <div className="mt-1">
          <ZonaTag zona={zona} />
        </div>
        <div className="mt-2">
          <Rating place={place} />
        </div>
        <p className="mt-2.5 line-clamp-2 max-w-prose text-sm leading-relaxed text-ink-2">
          {place.editorialNote}
        </p>
      </div>
    </li>
  );
}

function FilterPill({
  active,
  onClick,
  children,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition ${
        active
          ? "border-ink bg-ink text-canvas"
          : "border-hairline bg-surface text-ink-2 hover:border-ink/40 hover:text-ink"
      }`}
    >
      {dot && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />}
      {children}
    </button>
  );
}
