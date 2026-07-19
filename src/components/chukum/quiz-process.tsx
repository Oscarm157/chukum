"use client";

import { motion, useReducedMotion } from "motion/react";

// Ilustración minimalista del proceso del cuestionario: 4 barras que se llenan una a una
// y, al final, 2 resultados que se iluminan. Loop sutil. No es interactivo, solo comunica
// "responde y salen tus opciones". Respeta prefers-reduced-motion (estado final estático).
const BARS = [0, 1, 2, 3];
const CYCLE = 4.2; // segundos

export function QuizProcess({ paused = false }: { paused?: boolean }) {
  const reduceMotion = useReducedMotion();
  // Congelar el loop (estado final estático) cuando el usuario ya arrancó el
  // cuestionario: solo motiva antes de empezar, después distrae.
  const reduce = reduceMotion || paused;

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-2">Cómo funciona</p>

      <div className="mt-4 space-y-2.5">
        {BARS.map((i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-4 text-[11px] tabular-nums text-ink-2">{i + 1}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-canvas">
              <motion.div
                className="h-full origin-left rounded-full bg-cenote"
                style={{ scaleX: reduce ? 1 : undefined }}
                animate={reduce ? undefined : { scaleX: [0, 0, 1, 1, 0] }}
                transition={
                  reduce
                    ? undefined
                    : {
                        duration: CYCLE,
                        times: [0, i * 0.11, i * 0.11 + 0.12, 0.85, 1],
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                }
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 text-ink-2">
        <span className="h-px flex-1 bg-hairline" />
        <span className="text-[11px] uppercase tracking-[0.14em]">2 opciones para ti</span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            className="flex items-center gap-2 rounded-xl border border-cenote/40 bg-cenote/5 px-3 py-3"
            style={reduce ? { opacity: 1 } : undefined}
            animate={reduce ? undefined : { opacity: [0, 0, 1, 1, 0], y: [8, 8, 0, 0, 8] }}
            transition={
              reduce
                ? undefined
                : { duration: CYCLE, times: [0, 0.6, 0.72, 0.9, 1], repeat: Infinity, ease: "easeInOut", delay: i * 0.06 }
            }
          >
            <span className="h-7 w-7 shrink-0 rounded-md bg-cenote/25" />
            <span className="h-2 flex-1 rounded-full bg-cenote/30" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
