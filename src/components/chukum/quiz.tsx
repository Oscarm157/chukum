"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  TrendingUp,
  Home,
  Building2,
  Waves,
  Palmtree,
  Trees,
  LandPlot,
  Building,
  Sprout,
  Hammer,
  KeyRound,
  CircleDashed,
  ArrowLeft,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import {
  matchDevelopments,
  tiposLabel,
  ZONA_LABEL,
  TIPO_LABEL,
  type QuizAnswers,
  type Development,
} from "@/lib/developments";
import { STATUS_LABEL } from "@/lib/site";
import { CaptureForm } from "./capture-form";

type Option = { value: string; label: string; hint?: string; icon: LucideIcon };
type Question = { key: keyof QuizAnswers; title: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    key: "uso",
    title: "¿Cuál es el objetivo?",
    options: [
      { value: "invertir", label: "Invertir", hint: "Plusvalía y renta", icon: TrendingUp },
      { value: "vivir", label: "Vivir aquí", hint: "Tu casa en la península", icon: Home },
    ],
  },
  {
    key: "zona",
    title: "¿En qué zona?",
    options: [
      { value: "merida", label: "Mérida ciudad", icon: Building2 },
      { value: "costa", label: "Costa de Yucatán", icon: Waves },
      { value: "caribe", label: "Caribe, Q. Roo", icon: Palmtree },
      { value: "selva", label: "Selva maya", icon: Trees },
    ],
  },
  {
    key: "tipo",
    title: "¿Qué tipo de propiedad?",
    options: [
      { value: "terreno", label: "Terreno", icon: LandPlot },
      { value: "casa", label: "Casa", icon: Home },
      { value: "departamento", label: "Departamento", icon: Building },
    ],
  },
  {
    key: "etapa",
    title: "¿En qué etapa?",
    options: [
      { value: "preventa", label: "Preventa", icon: Sprout },
      { value: "en_construccion", label: "En construcción", icon: Hammer },
      { value: "entrega_inmediata", label: "Entrega inmediata", icon: KeyRound },
      { value: "cualquiera", label: "Cualquiera", icon: CircleDashed },
    ],
  },
];

export function Quiz({
  developments,
  onStartedChange,
}: {
  developments: Development[];
  onStartedChange?: (started: boolean) => void;
}) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [done, setDone] = useState(false);

  // Ya arrancó en cuanto respondió la primera pregunta. Las animaciones de
  // motivación (marquee + columna izquierda) se congelan a partir de aquí.
  const started = step > 0 || done;
  useEffect(() => {
    onStartedChange?.(started);
  }, [started, onStartedChange]);

  function choose(value: string) {
    const key = QUESTIONS[step].key;
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (step === QUESTIONS.length - 1) setDone(true);
    else setStep(step + 1);
  }

  function back() {
    if (done) {
      setDone(false);
      return;
    }
    if (step > 0) setStep(step - 1);
  }

  function restart() {
    setAnswers({});
    setStep(0);
    setDone(false);
  }

  const total = QUESTIONS.length;
  const progress = done ? total : step;
  const anim = reduce
    ? {}
    : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Progreso + volver */}
      <div className="flex items-center gap-4">
        {(step > 0 || done) && (
          <button
            onClick={back}
            className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Atrás
          </button>
        )}
        <div className="ml-auto text-xs uppercase tracking-[0.16em] text-ink-2">
          {done ? "Resultado" : `${step + 1} de ${total}`}
        </div>
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-hairline">
        <motion.div
          className="h-full rounded-full bg-cenote"
          initial={false}
          animate={{ width: `${((progress + (done ? 0 : 1)) / total) * 100}%` }}
          transition={{ duration: reduce ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key={`q-${step}`} {...anim} transition={{ duration: reduce ? 0 : 0.35 }} className="mt-8">
            <h3 className="font-display text-3xl leading-[1.05] tracking-[-0.02em] md:text-4xl">
              {QUESTIONS[step].title}
            </h3>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {QUESTIONS[step].options.map((o) => {
                const Icon = o.icon;
                const selected = answers[QUESTIONS[step].key] === o.value;
                return (
                  <button
                    key={o.value}
                    onClick={() => choose(o.value)}
                    className={`group flex flex-col items-start gap-3 rounded-2xl border bg-surface p-5 text-left transition hover:border-cenote hover:shadow-[0_8px_30px_-12px_rgba(30,26,22,0.25)] ${
                      selected ? "border-cenote ring-1 ring-cenote" : "border-hairline"
                    }`}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-chukum/25 text-chukum-deep transition group-hover:bg-cenote/12 group-hover:text-cenote">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-medium">{o.label}</span>
                      {o.hint && <span className="mt-0.5 block text-xs text-ink-2">{o.hint}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div key="result" {...anim} transition={{ duration: reduce ? 0 : 0.35 }} className="mt-8">
            <Result answers={answers as QuizAnswers} onRestart={restart} developments={developments} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Result({
  answers,
  onRestart,
  developments,
}: {
  answers: QuizAnswers;
  onRestart: () => void;
  developments: Development[];
}) {
  const matches = matchDevelopments(developments, answers);
  const resumen = `${answers.uso === "invertir" ? "Invertir" : "Vivir"} · ${ZONA_LABEL[answers.zona]} · ${TIPO_LABEL[answers.tipo]}`;
  const prefill = `Quiz: ${resumen}. Interés: ${matches.map((m) => m.heading).join(", ")}.`;

  return (
    <div>
      <p className="text-sm text-ink-2">Según lo que buscas: {resumen}.</p>
      <h3 className="mt-1 font-display text-3xl leading-[1.05] tracking-[-0.02em] md:text-4xl">
        Desarrollos que corresponden a tu perfil
      </h3>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {matches.map((d, i) => (
          <ResultCard key={d.slug} d={d} primary={i === 0} />
        ))}
      </div>

      <div className="mt-8">
        <p className="font-display text-xl tracking-[-0.01em]">
          Solicita disponibilidad y precios
        </p>
        <p className="mt-1 text-sm text-ink-2">
          Disponibilidad y precios directo del desarrollador, sin compromiso.
        </p>
        <div className="mt-4">
          <CaptureForm context={matches[0]?.heading} developmentSlug={matches[0]?.slug} prefillMessage={prefill} cta="Solicitar informes" />
        </div>
      </div>

      <button
        onClick={onRestart}
        className="mt-5 inline-flex items-center gap-1.5 text-sm text-ink-2 transition hover:text-ink"
      >
        <RotateCcw className="h-4 w-4" /> Empezar de nuevo
      </button>
    </div>
  );
}

function ResultCard({ d, primary }: { d: Development; primary: boolean }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-surface ${
        primary ? "border-cenote sm:col-span-2" : "border-hairline"
      }`}
    >
      <div className={`relative ${primary ? "h-52" : "h-40"}`}>
        <Image src={d.image} alt={d.alt} fill className="object-cover" sizes="(max-width:640px) 100vw, 50vw" />
        {primary && (
          <span className="absolute left-3 top-3 rounded-full bg-cenote px-3 py-1 text-xs font-medium text-canvas">
            Mayor coincidencia
          </span>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-cenote">{tiposLabel(d.tipos)}</p>
        <h4 className="mt-1 font-display text-2xl tracking-[-0.02em]">{d.heading}</h4>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{d.blurb}</p>
        <div className="mt-3">
          <Badge>{STATUS_LABEL[d.etapa]}</Badge>
        </div>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-hairline bg-canvas px-2.5 py-1 text-xs text-ink-2">
      {children}
    </span>
  );
}
