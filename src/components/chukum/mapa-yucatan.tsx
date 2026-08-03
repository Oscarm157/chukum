"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Plane, HeartPulse, GraduationCap, ShoppingBag, Trophy, Waves } from "lucide-react";
import { PROJECT_PINS, POIS, POI_LABEL, type Poi, type PoiCategory } from "@/lib/mapa";
import { DEVELOPMENTS, TIPO_LABEL, type Development } from "@/lib/developments";
import { STATUS_LABEL } from "@/lib/site";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const CATEGORY_ICON: Record<PoiCategory, ComponentType<{ className?: string }>> = {
  aeropuerto: Plane,
  salud: HeartPulse,
  educacion: GraduationCap,
  retail: ShoppingBag,
  ocio: Trophy,
  naturaleza: Waves,
};

function pillClass(active: boolean) {
  return `rounded-full px-4 py-2 text-sm font-medium transition ${
    active
      ? "bg-terracota text-canvas shadow-sm"
      : "border-2 border-hairline text-ink-2 hover:border-terracota hover:text-terracota"
  }`;
}

function DevPin() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-canvas bg-terracota shadow-md">
      <span className="h-2.5 w-2.5 rounded-full bg-canvas" />
    </div>
  );
}

function PoiPin({ category }: { category: PoiCategory }) {
  const Icon = CATEGORY_ICON[category];
  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-hairline bg-canvas text-ink-2 shadow-sm">
      <Icon className="h-3 w-3" />
    </div>
  );
}

function DevPopup({ dev, name }: { dev: Development; name: string }) {
  return (
    <div className="w-56 p-1">
      <p className="text-[10px] uppercase tracking-[0.14em] text-terracota">
        {dev.demo ? "Ejemplo" : STATUS_LABEL[dev.etapa]}
      </p>
      <h4 className="mt-1 font-display text-lg leading-tight tracking-[-0.01em]">{name}</h4>
      <p className="text-xs text-ink-2">{dev.heading}</p>
      <p className="mt-1 text-xs text-ink-2">{dev.tipos.map((t) => TIPO_LABEL[t]).join(" · ")}</p>
      {!dev.demo && (
        <a
          href={`/vivir-en-merida/desarrollos/${dev.slug}`}
          className="mt-2 inline-block text-xs font-medium text-terracota underline underline-offset-2"
        >
          Ver desarrollo
        </a>
      )}
    </div>
  );
}

function PoiPopup({ poi }: { poi: Poi }) {
  return (
    <div className="w-52 p-1">
      <p className="text-[10px] uppercase tracking-[0.14em] text-ink-2">{POI_LABEL[poi.category]}</p>
      <h4 className="mt-1 font-display text-base leading-tight tracking-[-0.01em]">{poi.name}</h4>
      {poi.blurb && <p className="mt-1 text-xs leading-relaxed text-ink-2">{poi.blurb}</p>}
    </div>
  );
}

const ALL_CATEGORIES = Object.keys(POI_LABEL) as PoiCategory[];

export function MapaYucatan() {
  const containerRef = useRef<HTMLDivElement>(null);
  const devMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const poiMarkersRef = useRef<{ marker: mapboxgl.Marker; category: PoiCategory }[]>([]);
  const [showDevs, setShowDevs] = useState(true);
  const [activeCats, setActiveCats] = useState<Set<PoiCategory>>(new Set(ALL_CATEGORIES));

  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-88.6, 20.7],
      zoom: 6,
      // El scroll normal de la página pasa por encima del mapa sin hacer zoom (zoom con
      // ctrl+rueda, pellizco o los botones). Evita que el mapa "atrape" el scroll de la página.
      cooperativeGestures: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      // Repinta la base al tono cálido de Chukum en vez del gris/azul default de Mapbox.
      const setPaint = (layer: string, prop: string, value: string) => {
        if (map.getLayer(layer)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          map.setPaintProperty(layer, prop as any, value);
        }
      };
      setPaint("water", "fill-color", "#dbe6df");
      setPaint("land", "background-color", "#f7f1e7");
      setPaint("background", "background-color", "#f7f1e7");
      ["poi-label", "transit-label", "airport-label", "settlement-minor-label"].forEach((l) => {
        if (map.getLayer(l)) map.setLayoutProperty(l, "visibility", "none");
      });

      const bounds = new mapboxgl.LngLatBounds();

      PROJECT_PINS.forEach((pin) => {
        const dev = DEVELOPMENTS.find((d) => d.slug === pin.slug);
        if (!dev) return;
        const el = document.createElement("div");
        createRoot(el).render(<DevPin />);
        const popupEl = document.createElement("div");
        createRoot(popupEl).render(<DevPopup dev={dev} name={pin.name} />);
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([pin.lng, pin.lat])
          .setPopup(new mapboxgl.Popup({ offset: 18, closeButton: false }).setDOMContent(popupEl))
          .addTo(map);
        devMarkersRef.current.push(marker);
        bounds.extend([pin.lng, pin.lat]);
      });

      POIS.forEach((poi) => {
        const el = document.createElement("div");
        createRoot(el).render(<PoiPin category={poi.category} />);
        const popupEl = document.createElement("div");
        createRoot(popupEl).render(<PoiPopup poi={poi} />);
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([poi.lng, poi.lat])
          .setPopup(new mapboxgl.Popup({ offset: 14, closeButton: false }).setDOMContent(popupEl))
          .addTo(map);
        poiMarkersRef.current.push({ marker, category: poi.category });
        bounds.extend([poi.lng, poi.lat]);
      });

      map.fitBounds(bounds, { padding: 56, duration: 0 });
    });

    return () => {
      map.remove();
      devMarkersRef.current = [];
      poiMarkersRef.current = [];
    };
  }, []);

  useEffect(() => {
    devMarkersRef.current.forEach((m) => {
      m.getElement().style.display = showDevs ? "" : "none";
    });
  }, [showDevs]);

  useEffect(() => {
    poiMarkersRef.current.forEach(({ marker, category }) => {
      marker.getElement().style.display = activeCats.has(category) ? "" : "none";
    });
  }, [activeCats]);

  const toggleCat = (cat: PoiCategory) =>
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  if (!TOKEN) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-3xl border-2 border-dashed border-hairline bg-surface-warm px-6 text-center text-sm text-ink-2">
        El mapa todavía no está configurado.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <button type="button" onClick={() => setShowDevs((v) => !v)} className={pillClass(showDevs)}>
          Desarrollos
        </button>
        {ALL_CATEGORIES.map((cat) => (
          <button key={cat} type="button" onClick={() => toggleCat(cat)} className={pillClass(activeCats.has(cat))}>
            {POI_LABEL[cat]}
          </button>
        ))}
      </div>
      <div
        ref={containerRef}
        className="h-[460px] w-full overflow-hidden rounded-3xl border-2 border-hairline md:h-[620px]"
      />
    </div>
  );
}
