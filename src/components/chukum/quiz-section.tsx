"use client";

import { useState } from "react";
import { SectionHead } from "./section-head";
import { Quiz } from "./quiz";
import { QuizProcess } from "./quiz-process";
import type { Development } from "@/lib/developments";

// Contiene las dos columnas del cuestionario y sube el estado "ya arrancó":
// mientras no arranca, el marquee y la columna izquierda animan para motivar;
// en cuanto responde la primera pregunta, ambas se congelan.
export function QuizSection({ developments }: { developments: Development[] }) {
  const [started, setStarted] = useState(false);

  return (
    <div className="mx-auto grid max-w-[1400px] gap-10 md:grid-cols-2 md:gap-16">
      <div>
        <SectionHead index="03" eyebrow="Cuestionario" title="Encuentra el desarrollo que corresponde a tu perfil" />
        <p className="mt-4 max-w-md text-ink-2">
          Cuatro preguntas sobre zona, tipo de propiedad y etapa. Al final se pueden dejar los datos
          para recibir disponibilidad y precios.
        </p>
        <div className="mt-8">
          <QuizProcess paused={started} />
        </div>
      </div>
      <div
        className={`rounded-3xl bg-surface p-6 md:p-10 ${started ? "border border-hairline" : "quiz-marquee"}`}
      >
        <Quiz developments={developments} onStartedChange={setStarted} />
      </div>
    </div>
  );
}
