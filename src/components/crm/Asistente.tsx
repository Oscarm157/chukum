"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  PanelRightClose,
  Sparkles,
  ArrowUp,
  Check,
  X,
  Filter,
  ArrowUpDown,
  MousePointerClick,
  Compass,
  FolderPlus,
  Database,
} from "lucide-react";
import {
  keywordsStore,
  calcularVisibles,
  claveIdea,
  type Columna,
} from "@/app/admin/(panel)/keywords/KeywordsContext";
import { crearGrupo } from "@/app/admin/(panel)/keywords/actions";
import { Markdown } from "./Markdown";

/**
 * Asistente de pauta: chatea y además mueve la pantalla (filtra, ordena, selecciona).
 * Las acciones se aplican solas porque son reversibles; guardar un grupo pasa por
 * una tarjeta de sí/no.
 */

const CLAVE_ABIERTO = "asistente-abierto";
const CLAVE_ANCHO = "asistente-ancho";
const ANCHO_MIN = 320;
const ANCHO_MAX = 720;
const MUESTRA_MAX = 25; // keywords que ve el modelo por turno; el resto las pide con consultar_mercado

type Bloque = { type: string; [k: string]: unknown };
type Mensaje = { role: "user" | "assistant"; content: string | Bloque[] };

type Tarjeta =
  | { tipo: "accion"; texto: string; herramienta: string }
  | { tipo: "propuesta"; id: string; input: Propuesta; resuelta?: "si" | "no" };

type Propuesta = {
  nombre: string;
  plaza: string;
  tema: "terrenos" | "casas" | "departamentos" | "otro";
  mercado: "nacional_es" | "extranjero_en";
  keywords: string[];
  porque?: string;
};

type Turno = { rol: "yo" | "asistente"; texto: string; avance: string; tarjetas: Tarjeta[] };

const SUGERENCIAS = [
  "¿Dónde pauto 1,000 USD para vender 3 casas al mes?",
  "Ponme las mejores keywords precio-calidad con 300 USD",
  "Arma un grupo de Mérida terrenos",
];

const num = (n: number) => n.toLocaleString("es-MX", { maximumFractionDigits: 0 });

/** La última frase completa del razonamiento: ni el párrafo entero ni tres palabras sueltas. */
function ultimaFrase(texto: string) {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (!limpio) return "";
  const frases = limpio.split(/(?<=[.:;?!])\s+/).filter((f) => f.length > 12);
  const ultima = frases.at(-1) ?? limpio;
  return ultima.length > 200 ? `...${ultima.slice(-200)}` : ultima;
}

export function Asistente() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [abierto, setAbierto] = useState(false);
  const [ancho, setAncho] = useState(400);
  const [montado, setMontado] = useState(false);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [entrada, setEntrada] = useState("");
  const [pensando, setPensando] = useState(false);
  const historial = useRef<Mensaje[]>([]);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAbierto(localStorage.getItem(CLAVE_ABIERTO) === "1");
      const guardado = Number(localStorage.getItem(CLAVE_ANCHO));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (guardado >= ANCHO_MIN && guardado <= ANCHO_MAX) setAncho(guardado);
    } catch {
      // sin localStorage arranca cerrado
    }
    setMontado(true);
  }, []);

  // Marca el <html> para que el panel se recorra en vez de quedar tapado
  // (mismo patrón que data-crm-theme).
  useEffect(() => {
    if (!montado) return;
    localStorage.setItem(CLAVE_ABIERTO, abierto ? "1" : "0");
    document.documentElement.dataset.asistente = abierto ? "abierto" : "cerrado";
    // El recorrido del contenido lee este ancho: así no se descuadran al arrastrar.
    document.documentElement.style.setProperty("--asistente-ancho", `${ancho}px`);
    return () => {
      delete document.documentElement.dataset.asistente;
    };
  }, [montado, abierto, ancho]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turnos, pensando]);

  function arrastrar(e: React.MouseEvent) {
    e.preventDefault();
    const mover = (ev: MouseEvent) => {
      const nuevo = Math.min(ANCHO_MAX, Math.max(ANCHO_MIN, window.innerWidth - ev.clientX));
      setAncho(nuevo);
    };
    const soltar = () => {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", soltar);
      document.body.style.userSelect = "";
      setAncho((a) => {
        localStorage.setItem(CLAVE_ANCHO, String(a));
        return a;
      });
    };
    document.body.style.userSelect = "none"; // sin esto se selecciona texto al arrastrar
    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", soltar);
  }

  const enKeywords = pathname.startsWith("/admin/keywords");

  /** Lo que el modelo ve de la pantalla: sin esto contesta de oído. */
  function contextoActual() {
    const estado = keywordsStore.leer();
    const visibles = calcularVisibles(estado);
    return {
      pantalla: pathname.includes("/grupos") ? "grupos" : "keywords",
      plaza: searchParams.get("plaza") ?? undefined,
      mercado: searchParams.get("mercado") ?? undefined,
      visibles: visibles.length,
      seleccionadas: visibles.filter((k) => estado.elegidas.has(claveIdea(k))).length,
      muestra: visibles.slice(0, MUESTRA_MAX).map((k) => ({
        keyword: k.keyword,
        volumen: k.volumen,
        cpc: k.cpc,
        competencia: k.competencia,
        plaza: k.plaza,
        mercado: k.mercado,
      })),
    };
  }

  /** Ejecuta una herramienta de pantalla y describe qué pasó, para el modelo y para la UI. */
  function aplicarAccion(nombre: string, input: Record<string, unknown>): string {
    switch (nombre) {
      case "aplicar_filtros": {
        const partes: string[] = [];
        const parcial: Record<string, unknown> = {};
        if (typeof input.busqueda === "string") {
          parcial.busqueda = input.busqueda;
          partes.push(input.busqueda ? `texto "${input.busqueda}"` : "sin filtro de texto");
        }
        if (typeof input.min_volumen === "number") {
          parcial.minVolumen = input.min_volumen;
          partes.push(input.min_volumen ? `volumen ≥ ${num(input.min_volumen)}` : "cualquier volumen");
        }
        if (Array.isArray(input.competencias)) {
          parcial.competencias = input.competencias;
          partes.push(
            input.competencias.length ? `competencia ${input.competencias.join(", ")}` : "toda competencia",
          );
        }
        if (typeof input.solo_con_puja === "boolean") {
          parcial.soloConPuja = input.solo_con_puja;
          if (input.solo_con_puja) partes.push("solo con puja");
        }
        keywordsStore.setFiltros(parcial);
        const quedan = calcularVisibles(keywordsStore.leer()).length;
        return `Filtros: ${partes.join(", ") || "sin cambios"}. Quedan ${num(quedan)} keywords.`;
      }
      case "ordenar": {
        const col = String(input.columna) as Columna;
        keywordsStore.setOrden({ col, desc: input.direccion !== "asc" });
        return `Ordenado por ${col} ${input.direccion === "asc" ? "de menor a mayor" : "de mayor a menor"}.`;
      }
      case "seleccionar_keywords": {
        const pedidas = (input.keywords as string[]) ?? [];
        const n = keywordsStore.seleccionarPorTexto(pedidas, input.reemplazar !== false);
        const estado = keywordsStore.leer();
        const sel = calcularVisibles(estado).filter((k) => estado.elegidas.has(claveIdea(k)));
        const vol = sel.reduce((a, k) => a + k.volumen, 0);
        const conPuja = sel.filter((k) => k.cpc > 0);
        const cpc = conPuja.length
          ? conPuja.reduce((a, k) => a + k.cpc * k.volumen, 0) /
            Math.max(1, conPuja.reduce((a, k) => a + k.volumen, 0))
          : 0;
        const faltaron = pedidas.length - n;
        return `${n} keywords seleccionadas · ${num(vol)} búsquedas/mes · CPC $${cpc.toFixed(2)}${
          faltaron > 0 ? ` (${faltaron} no existían en la tabla)` : ""
        }`;
      }
      case "navegar": {
        const p = new URLSearchParams();
        if (input.plaza) p.set("plaza", String(input.plaza));
        if (input.mercado) p.set("mercado", String(input.mercado));
        const ruta =
          input.destino === "grupos"
            ? "/admin/keywords/grupos"
            : `/admin/keywords${p.size ? `?${p}` : ""}`;
        router.push(ruta);
        return `Abriendo ${ruta}`;
      }
      default:
        return `Acción desconocida: ${nombre}`;
    }
  }

  async function enviar(texto: string) {
    if (!texto.trim() || pensando) return;
    setEntrada("");
    setTurnos((t) => [...t, { rol: "yo", texto, avance: "", tarjetas: [] }]);
    historial.current.push({ role: "user", content: texto });
    await correr();
  }

  /** Un turno completo: stream de texto, acciones y, si las hubo, otra vuelta con resultados. */
  async function correr() {
    setPensando(true);
    setTurnos((t) => [...t, { rol: "asistente", texto: "", avance: "", tarjetas: [] }]);

    // Sin esto, si el stream se corta sin cerrar (timeout del proxy, función que
    // excede su límite) la UI se queda en "Pensando" para siempre.
    const corte = new AbortController();
    const reloj = setTimeout(() => corte.abort(), 90_000);

    try {
      const res = await fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historial.current, contexto: contextoActual() }),
        signal: corte.signal,
      });

      if (!res.ok || !res.body) {
        const { error } = await res.json().catch(() => ({ error: "Falló la llamada." }));
        actualizarUltimo((t) => ({ ...t, texto: error ?? "Falló la llamada." }));
        return;
      }

      const lector = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const resultados: Array<{ type: "tool_result"; tool_use_id: string; content: string }> = [];
      let finalContent: Bloque[] = [];

      while (true) {
        const { done, value } = await lector.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lineas = buffer.split("\n\n");
        buffer = lineas.pop() ?? "";

        for (const linea of lineas) {
          if (!linea.startsWith("data: ")) continue;
          const evento = JSON.parse(linea.slice(6));

          if (evento.type === "texto") {
            actualizarUltimo((t) => ({ ...t, texto: t.texto + evento.texto }));
          } else if (evento.type === "pensamiento") {
            actualizarUltimo((t) => ({ ...t, avance: t.avance + evento.texto }));
          } else if (evento.type === "accion") {
            if (evento.resumen) {
              // Herramienta de servidor: solo se informa, no toca la pantalla.
              actualizarUltimo((tu) => ({
                ...tu,
                tarjetas: [
                  ...tu.tarjetas,
                  {
                    tipo: "accion",
                    texto: `Consulté los datos medidos: ${evento.resumen}`,
                    herramienta: "consultar_mercado",
                  },
                ],
              }));
              continue;
            }
            const resumen = aplicarAccion(evento.nombre, evento.input);
            resultados.push({ type: "tool_result", tool_use_id: evento.id, content: resumen });
            actualizarUltimo((t) => ({
              ...t,
              tarjetas: [
                ...t.tarjetas,
                { tipo: "accion", texto: resumen, herramienta: evento.nombre },
              ],
            }));
          } else if (evento.type === "propuesta") {
            actualizarUltimo((t) => ({
              ...t,
              tarjetas: [
                ...t.tarjetas,
                { tipo: "propuesta", id: evento.id, input: evento.input as Propuesta },
              ],
            }));
            resultados.push({
              type: "tool_result",
              tool_use_id: evento.id,
              content: "Propuesta mostrada. Oscar decide si la guarda.",
            });
          } else if (evento.type === "fin") {
            finalContent = evento.mensaje as Bloque[];
            if (evento.stop === "max_tokens") {
              actualizarUltimo((tu) => ({
                ...tu,
                texto: `${tu.texto}\n\n_(La respuesta llegó al límite de largo y se cortó aquí. Pídeme que continúe.)_`,
              }));
            }
            for (const r of evento.resultadosServidor ?? []) resultados.push(r);
          } else if (evento.type === "error") {
            actualizarUltimo((t) => ({ ...t, texto: t.texto || evento.mensaje }));
          }
        }
      }

      actualizarUltimo((tu) => ({ ...tu, avance: "" }));

      if (!finalContent.length) {
        // El stream terminó sin el evento de cierre: se cortó a medias.
        actualizarUltimo((t) => ({
          ...t,
          texto: t.texto || "La respuesta se cortó antes de terminar. Vuelve a intentar.",
        }));
        return;
      }
      historial.current.push({ role: "assistant", content: finalContent });

      actualizarUltimo((tu) =>
        tu.texto || tu.tarjetas.length
          ? tu
          : { ...tu, texto: "Terminé sin nada que responder. Vuelve a preguntarme." },
      );

      // Si hubo herramientas, el modelo necesita saber qué pasó de verdad.
      if (resultados.length) {
        historial.current.push({ role: "user", content: resultados as unknown as Bloque[] });
        setPensando(false);
        await correr();
        return;
      }
    } catch (e) {
      const abortado = e instanceof Error && e.name === "AbortError";
      actualizarUltimo((t) => ({
        ...t,
        texto:
          t.texto ||
          (abortado
            ? "Se tardó más de 90 segundos y lo corté. Vuelve a intentar."
            : "Se cortó la conexión."),
      }));
    } finally {
      clearTimeout(reloj);
      setPensando(false);
    }
  }

  function actualizarUltimo(fn: (t: Turno) => Turno) {
    setTurnos((prev) => {
      const next = [...prev];
      const i = next.length - 1;
      if (i >= 0) next[i] = fn(next[i]);
      return next;
    });
  }

  async function aceptarPropuesta(idx: number, tIdx: number, p: Propuesta) {
    const estado = keywordsStore.leer();
    const porTexto = new Map(estado.ideas.map((k) => [k.keyword.toLowerCase(), k]));
    const keywords = p.keywords
      .map((t) => porTexto.get(t.trim().toLowerCase()))
      .filter((k): k is NonNullable<typeof k> => Boolean(k))
      .map((k) => ({
        keyword: k.keyword,
        volumen: k.volumen,
        cpc: k.cpc,
        competencia: k.competencia,
      }));

    if (!keywords.length) {
      marcarPropuesta(idx, tIdx, "no");
      return;
    }

    await crearGrupo({
      nombre: p.nombre,
      plaza: p.plaza,
      tema: p.tema,
      mercado: p.mercado,
      keywords,
    });
    marcarPropuesta(idx, tIdx, "si");
    router.refresh();
  }

  function marcarPropuesta(idx: number, tIdx: number, r: "si" | "no") {
    setTurnos((prev) => {
      const next = [...prev];
      const tarjetas = [...next[idx].tarjetas];
      const t = tarjetas[tIdx];
      if (t?.tipo === "propuesta") tarjetas[tIdx] = { ...t, resuelta: r };
      next[idx] = { ...next[idx], tarjetas };
      return next;
    });
  }

  if (!montado) return null;

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Abrir asistente"
        className="fixed right-4 bottom-4 z-30 flex items-center gap-2 rounded-full border border-[var(--crm-line)] bg-[var(--crm-surface-2)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--crm-ink)] shadow-lg transition-colors hover:bg-[var(--crm-surface-3)]"
      >
        <Sparkles className="size-4 text-[var(--crm-accent-strong)]" />
        Asistente
      </button>
    );
  }

  return (
    <aside
      style={{ ["--ancho" as string]: `${ancho}px` }}
      className="fixed inset-y-0 right-0 z-30 flex w-full flex-col border-l border-[var(--crm-line)] bg-[var(--crm-surface)] sm:w-[var(--ancho)]"
    >
      {/* Tirador para ajustar el ancho */}
      <div
        onMouseDown={arrastrar}
        role="separator"
        aria-label="Ajustar ancho del asistente"
        className="absolute inset-y-0 -left-1 hidden w-2 cursor-col-resize hover:bg-[var(--crm-accent)]/30 sm:block"
      />
      <header className="flex items-center gap-2 border-b border-[var(--crm-line)] px-4 py-3">
        <Sparkles className="size-4 text-[var(--crm-accent-strong)]" />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-medium text-[var(--crm-ink)]">Asistente de pauta</p>
          <p className="truncate text-[12px] text-[var(--crm-ink-mute)]">
            {enKeywords ? <EstadoPantalla /> : "Abre Keywords para que pueda mover la tabla"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          aria-label="Cerrar asistente"
          className="text-[var(--crm-ink-faint)] transition-colors hover:text-[var(--crm-ink)]"
        >
          <PanelRightClose className="size-4" />
        </button>
      </header>

      <div data-lenis-prevent className="crm-scroll flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {turnos.length === 0 && (
          <div className="space-y-2">
            <p className="text-[13px] leading-relaxed text-[var(--crm-ink-soft)]">
              Puedo mover la tabla por ti y ayudarte a decidir dónde pautar con los números que ya
              tienes medidos.
            </p>
            {SUGERENCIAS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => enviar(s)}
                className="block w-full rounded-[var(--crm-r-md)] border border-[var(--crm-line)] px-3 py-2 text-left text-[13px] text-[var(--crm-ink-soft)] transition-colors hover:border-[var(--crm-line-strong)] hover:text-[var(--crm-ink)]"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {turnos.map((t, i) => (
          <div key={i} className={t.rol === "yo" ? "flex justify-end" : ""}>
            {t.rol === "yo" ? (
              <p className="max-w-[85%] rounded-[var(--crm-r-md)] bg-[var(--crm-surface-3)] px-3 py-2 text-[13.5px] text-[var(--crm-ink)]">
                {t.texto}
              </p>
            ) : (
              <div className="space-y-2">
                {!t.texto && t.avance && (
                  <p className="border-l-2 border-[var(--crm-line)] pl-2.5 text-[12.5px] leading-relaxed text-[var(--crm-ink-faint)]">
                    {ultimaFrase(t.avance)}
                  </p>
                )}
                {t.texto && <Markdown texto={t.texto} />}
                {t.tarjetas.map((c, j) =>
                  c.tipo === "accion" ? (
                    <TarjetaAccion key={j} herramienta={c.herramienta} texto={c.texto} />
                  ) : (
                    <div
                      key={j}
                      className={`overflow-hidden rounded-[var(--crm-r-md)] border-2 ${
                        c.resuelta
                          ? "border-[var(--crm-line)]"
                          : "border-[var(--crm-accent)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--crm-accent)_15%,transparent)]"
                      }`}
                    >
                      <div className="flex items-center gap-2 bg-[var(--crm-accent)] px-3 py-1.5">
                        <FolderPlus className="size-3.5 text-white" />
                        <span className="text-[12px] font-semibold tracking-wide text-white uppercase">
                          {c.resuelta ? "Propuesta" : "Confirma para guardar"}
                        </span>
                      </div>
                      <div className="bg-[var(--crm-surface-2)] p-3">
                        <p className="text-[15px] font-semibold text-[var(--crm-ink)]">
                          {c.input.nombre}
                        </p>
                        <p className="mt-0.5 text-[12px] text-[var(--crm-ink-mute)]">
                          {c.input.plaza} · {c.input.tema} · {c.input.keywords.length} keywords
                        </p>
                        {c.input.porque && (
                          <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--crm-ink-soft)]">
                            {c.input.porque}
                          </p>
                        )}
                        {c.resuelta ? (
                          <p className="mt-2.5 flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--crm-ink)]">
                            {c.resuelta === "si" ? (
                              <>
                                <Check className="size-3.5 text-[var(--crm-accent-strong)]" />
                                Grupo creado
                              </>
                            ) : (
                              <>
                                <X className="size-3.5" />
                                Descartado
                              </>
                            )}
                          </p>
                        ) : (
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => aceptarPropuesta(i, j, c.input)}
                              className="crm-btn crm-btn-primary flex-1"
                            >
                              <Check className="size-4" />
                              Crear grupo
                            </button>
                            <button
                              type="button"
                              onClick={() => marcarPropuesta(i, j, "no")}
                              className="crm-btn crm-btn-secondary"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        ))}

        {pensando && !turnos.at(-1)?.avance && !turnos.at(-1)?.texto && (
          <p className="text-[13px] text-[var(--crm-ink-faint)]">Pensando...</p>
        )}
        <div ref={finRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(entrada);
        }}
        className="flex items-end gap-2 border-t border-[var(--crm-line)] p-3"
      >
        <textarea
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar(entrada);
            }
          }}
          rows={2}
          placeholder="Pídeme filtrar, seleccionar o dónde pautar"
          className="crm-textarea flex-1 resize-none"
        />
        <button
          type="submit"
          disabled={pensando || !entrada.trim()}
          aria-label="Enviar"
          className="crm-btn crm-btn-sm crm-btn-primary h-9 px-3"
        >
          <ArrowUp className="size-4" />
        </button>
      </form>
    </aside>
  );
}

/** Cada acción con su icono y etiqueta: se distingue de un vistazo qué tocó el asistente. */
const ACCIONES: Record<string, { icono: typeof Filter; label: string }> = {
  aplicar_filtros: { icono: Filter, label: "Filtró" },
  ordenar: { icono: ArrowUpDown, label: "Ordenó" },
  seleccionar_keywords: { icono: MousePointerClick, label: "Seleccionó" },
  navegar: { icono: Compass, label: "Abrió" },
  consultar_mercado: { icono: Database, label: "Consultó datos" },
};

function TarjetaAccion({ herramienta, texto }: { herramienta: string; texto: string }) {
  const a = ACCIONES[herramienta] ?? { icono: Sparkles, label: "Acción" };
  const Icono = a.icono;
  return (
    <div className="flex items-start gap-2.5 rounded-[var(--crm-r-md)] border border-[color-mix(in_srgb,var(--crm-accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--crm-accent)_10%,transparent)] px-3 py-2.5">
      <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--crm-accent)]">
        <Icono className="size-3.5 text-white" />
      </span>
      <span className="min-w-0 flex-1 text-[12.5px] leading-snug text-[var(--crm-ink)]">
        <span className="font-semibold text-[var(--crm-accent-strong)]">{a.label}.</span>{" "}
        {texto}
      </span>
    </div>
  );
}

/** Qué está viendo ahora mismo, para que los dos miren lo mismo. */
function EstadoPantalla() {
  const [texto, setTexto] = useState("");
  useEffect(() => {
    const calcular = () => {
      const estado = keywordsStore.leer();
      const visibles = calcularVisibles(estado);
      const sel = visibles.filter((k) => estado.elegidas.has(claveIdea(k))).length;
      setTexto(
        `${num(visibles.length)} keywords a la vista${sel ? ` · ${num(sel)} seleccionadas` : ""}`,
      );
    };
    calcular();
    return keywordsStore.suscribir(calcular);
  }, []);
  return <>{texto}</>;
}
