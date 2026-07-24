"use client";

import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { IdeaFila } from "@/lib/keywords-data";

/**
 * El estado de la tabla vive en un store de módulo, no en un contexto: el asistente
 * está montado en el layout y la tabla en la página, así que no hay una relación
 * padre-hijo que un contexto pueda cubrir. Con esto los dos leen y escriben lo mismo.
 */

export type Columna = "keyword" | "plaza" | "volumen" | "competencia" | "cpc";
export type Filtros = {
  busqueda: string;
  minVolumen: number;
  competencias: string[];
  soloConPuja: boolean;
};
export type Orden = { col: Columna; desc: boolean };

const PESO: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
export const claveIdea = (k: IdeaFila) => `${k.keyword}·${k.mercado}`;

const FILTROS_VACIOS: Filtros = {
  busqueda: "",
  minVolumen: 0,
  competencias: [],
  soloConPuja: false,
};

type Estado = {
  ideas: IdeaFila[];
  filtros: Filtros;
  orden: Orden;
  elegidas: Set<string>;
  /** Sube las seleccionadas al principio: si el asistente elige 8 de 600, que se vean. */
  subirSeleccionadas: boolean;
};

let estado: Estado = {
  ideas: [],
  filtros: FILTROS_VACIOS,
  orden: { col: "volumen", desc: true },
  elegidas: new Set(),
  subirSeleccionadas: false,
};

const suscriptores = new Set<() => void>();
const avisar = () => suscriptores.forEach((f) => f());

function set(parcial: Partial<Estado>) {
  estado = { ...estado, ...parcial };
  avisar();
}

export const keywordsStore = {
  suscribir(f: () => void) {
    suscriptores.add(f);
    return () => {
      suscriptores.delete(f);
    };
  },
  leer: () => estado,

  cargarIdeas(ideas: IdeaFila[]) {
    // Al cambiar de filtro de ciudad la página trae otras keywords: la selección
    // previa ya no aplica.
    set({ ideas, elegidas: new Set(), subirSeleccionadas: false });
  },
  setFiltros(parcial: Partial<Filtros>) {
    set({ filtros: { ...estado.filtros, ...parcial } });
  },
  setOrden(orden: Orden) {
    // Si el usuario ordena a mano, manda su orden: deja de subir las seleccionadas.
    set({ orden, subirSeleccionadas: false });
  },
  alternar(k: IdeaFila) {
    const next = new Set(estado.elegidas);
    const c = claveIdea(k);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    set({ elegidas: next });
  },
  alternarTodas(visibles: IdeaFila[]) {
    const todas = visibles.length > 0 && visibles.every((k) => estado.elegidas.has(claveIdea(k)));
    const next = new Set(estado.elegidas);
    visibles.forEach((k) => (todas ? next.delete(claveIdea(k)) : next.add(claveIdea(k))));
    set({ elegidas: next });
  },
  limpiarSeleccion() {
    set({ elegidas: new Set(), subirSeleccionadas: false });
  },
  /** Selecciona por texto exacto. Es lo que usa el asistente; devuelve cuántas encontró. */
  seleccionarPorTexto(keywords: string[], reemplazar = true) {
    const buscadas = new Set(keywords.map((k) => k.trim().toLowerCase()));
    const encontradas = estado.ideas.filter((k) => buscadas.has(k.keyword.toLowerCase()));
    const next = reemplazar ? new Set<string>() : new Set(estado.elegidas);
    encontradas.forEach((k) => next.add(claveIdea(k)));
    set({ elegidas: next, subirSeleccionadas: next.size > 0 });
    return encontradas.length;
  },
};

/** Aplica filtros y orden. Fuera del store para que sea puro y memoizable. */
export function calcularVisibles(estado: Estado): IdeaFila[] {
  const { ideas, filtros, orden } = estado;
  const q = filtros.busqueda.trim().toLowerCase();
  const filtradas = ideas.filter((k) => {
    if (q && !k.keyword.toLowerCase().includes(q)) return false;
    if (k.volumen < filtros.minVolumen) return false;
    if (filtros.competencias.length && !filtros.competencias.includes(k.competencia)) return false;
    if (filtros.soloConPuja && k.cpc <= 0) return false;
    return true;
  });
  const signo = orden.desc ? -1 : 1;
  const ordenadas = [...filtradas].sort((a, b) => {
    switch (orden.col) {
      case "keyword":
        return signo * a.keyword.localeCompare(b.keyword);
      case "plaza":
        return signo * (a.plaza.localeCompare(b.plaza) || b.volumen - a.volumen);
      case "competencia":
        return (
          signo * ((PESO[a.competencia] ?? 0) - (PESO[b.competencia] ?? 0) || a.indice - b.indice)
        );
      case "cpc":
        return signo * (a.cpc - b.cpc);
      default:
        return signo * (a.volumen - b.volumen);
    }
  });

  if (!estado.subirSeleccionadas || estado.elegidas.size === 0) return ordenadas;
  // Estable: las elegidas conservan entre sí el orden de la columna activa.
  const elegidas = ordenadas.filter((k) => estado.elegidas.has(claveIdea(k)));
  const resto = ordenadas.filter((k) => !estado.elegidas.has(claveIdea(k)));
  return [...elegidas, ...resto];
}

export function useKeywords() {
  const snapshot = useSyncExternalStore(
    keywordsStore.suscribir,
    keywordsStore.leer,
    keywordsStore.leer,
  );
  const visibles = useMemo(() => calcularVisibles(snapshot), [snapshot]);
  const seleccion = useMemo(
    () => visibles.filter((k) => snapshot.elegidas.has(claveIdea(k))),
    [visibles, snapshot.elegidas],
  );
  return {
    ...snapshot,
    visibles,
    seleccion,
    setFiltros: keywordsStore.setFiltros,
    setOrden: keywordsStore.setOrden,
    alternar: keywordsStore.alternar,
    alternarTodas: () => keywordsStore.alternarTodas(visibles),
    limpiarSeleccion: keywordsStore.limpiarSeleccion,
    seleccionarPorTexto: keywordsStore.seleccionarPorTexto,
  };
}

/** Carga en el store las keywords que trajo el servidor para el filtro actual. */
export function KeywordsProvider({ ideas, children }: { ideas: IdeaFila[]; children: ReactNode }) {
  useEffect(() => {
    keywordsStore.cargarIdeas(ideas);
  }, [ideas]);
  return <>{children}</>;
}
