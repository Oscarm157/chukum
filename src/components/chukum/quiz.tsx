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
  ArrowRight,
  RotateCcw,
  Loader2,
  Check,
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

type Option = { value: string; label: string; hint?: string; icon: LucideIcon };
type Question = { key: keyof QuizAnswers; title: string; options: Option[] };
type Phase = "quiz" | "gate" | "analyzing" | "result";
type Contact = { name: string; email: string };

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
  const [phase, setPhase] = useState<Phase>("quiz");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [contact, setContact] = useState<Contact>({ name: "", email: "" });

  // Ya arrancó en cuanto respondió la primera pregunta. Las animaciones de
  // motivación (marquee + columna izquierda) se congelan a partir de aquí.
  const started = step > 0 || phase !== "quiz";
  useEffect(() => {
    onStartedChange?.(started);
  }, [started, onStartedChange]);

  function choose(value: string) {
    const key = QUESTIONS[step].key;
    const next = { ...answers, [key]: value };
    setAnswers(next);
    // Al contestar la última pregunta pasamos al gate (nombre+correo), no directo al resultado.
    if (step === QUESTIONS.length - 1) setPhase("gate");
    else setStep(step + 1);
  }

  function back() {
    if (phase === "gate") {
      setPhase("quiz");
      return;
    }
    if (phase !== "quiz") return; // desde analizando/resultado no se vuelve atrás
    if (step > 0) setStep(step - 1);
  }

  function restart() {
    setAnswers({});
    setStep(0);
    setPhase("quiz");
    setLeadId(null);
    setContact({ name: "", email: "" });
  }

  // Gate → guarda el lead con nombre+correo y muestra el interstitial ~1.5 s antes del resultado.
  async function submitGate(c: Contact) {
    setContact(c);
    setPhase("analyzing");
    const a = answers as QuizAnswers;
    const matches = matchDevelopments(developments, a);
    const resumen = `${a.uso === "invertir" ? "Invertir" : "Vivir"} · ${ZONA_LABEL[a.zona]} · ${TIPO_LABEL[a.tipo]}`;
    const message = `Quiz: ${resumen}. Interés: ${matches.map((m) => m.heading).join(", ")}.`;
    const delay = new Promise((r) => setTimeout(r, reduce ? 0 : 1500));
    let id: string | null = null;
    try {
      const [res] = await Promise.all([
        fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: c.name,
            email: c.email,
            message,
            locale: "es",
            source: "form",
            sourceUrl: typeof window !== "undefined" ? window.location.pathname : undefined,
            zonaSlug: a.zona,
            developmentSlug: matches[0]?.slug,
          }),
        }),
        delay,
      ]);
      if (res.ok) {
        const data = await res.json().catch(() => null);
        id = data?.id ?? null;
      }
    } catch {
      // El POST falló: igual mostramos resultados; PhoneStep hará fallback a POST completo.
    }
    setLeadId(id);
    setPhase("result");
  }

  const total = QUESTIONS.length;
  const isQuiz = phase === "quiz";
  const barWidth = isQuiz ? ((step + 1) / total) * 100 : 100;
  const label =
    phase === "quiz"
      ? `${step + 1} de ${total}`
      : phase === "gate"
        ? "Casi listo"
        : phase === "analyzing"
          ? "Analizando"
          : "Resultado";
  const anim = reduce
    ? {}
    : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Progreso + volver */}
      <div className="flex items-center gap-4">
        {((step > 0 && isQuiz) || phase === "gate") && (
          <button
            onClick={back}
            className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Atrás
          </button>
        )}
        <div className="ml-auto text-xs uppercase tracking-[0.16em] text-ink-2">{label}</div>
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-hairline">
        <motion.div
          className="h-full rounded-full bg-cenote"
          initial={false}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: reduce ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <AnimatePresence mode="wait">
        {phase === "quiz" ? (
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
        ) : phase === "gate" ? (
          <motion.div key="gate" {...anim} transition={{ duration: reduce ? 0 : 0.35 }} className="mt-8">
            <GateForm onSubmit={submitGate} />
          </motion.div>
        ) : phase === "analyzing" ? (
          <motion.div key="analyzing" {...anim} transition={{ duration: reduce ? 0 : 0.35 }} className="mt-8">
            <Analyzing />
          </motion.div>
        ) : (
          <motion.div key="result" {...anim} transition={{ duration: reduce ? 0 : 0.35 }} className="mt-8">
            <Result
              answers={answers as QuizAnswers}
              developments={developments}
              leadId={leadId}
              contact={contact}
              onRestart={restart}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GateForm({ onSubmit }: { onSubmit: (c: Contact) => void }) {
  function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    onSubmit({
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
    });
  }

  return (
    <div>
      <h3 className="font-display text-3xl leading-[1.05] tracking-[-0.02em] md:text-4xl">
        Tus datos para ver los resultados
      </h3>
      <p className="mt-2 text-sm text-ink-2">
        Nombre y correo para mostrarte los desarrollos que corresponden a tu perfil. Sin compromiso.
      </p>
      <form onSubmit={handle} className="mt-6 rounded-3xl border border-hairline bg-surface p-6 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.16em] text-ink-2">Nombre</span>
            <input
              name="name"
              required
              autoComplete="name"
              placeholder="Tu nombre…"
              className="mt-1.5 w-full rounded-2xl border border-hairline bg-canvas px-4 py-2.5 text-sm outline-none transition focus:border-cenote"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.16em] text-ink-2">Correo</span>
            <input
              name="email"
              type="email"
              inputMode="email"
              required
              autoComplete="email"
              spellCheck={false}
              placeholder="tu@correo.com…"
              className="mt-1.5 w-full rounded-2xl border border-hairline bg-canvas px-4 py-2.5 text-sm outline-none transition focus:border-cenote"
            />
          </label>
        </div>
        <button
          type="submit"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cenote px-6 py-3.5 text-sm font-medium text-canvas transition hover:bg-cenote-deep"
        >
          Ver mis resultados <ArrowRight className="h-4 w-4" />
        </button>
        <p className="mt-3 text-center text-xs text-ink-2">Los datos solo se usan para contactarte.</p>
      </form>
    </div>
  );
}

function Analyzing() {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-hairline bg-surface px-6 py-16 text-center">
      <div className="flex items-end gap-1.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="w-2 rounded-full bg-cenote"
            initial={{ height: 12 }}
            animate={reduce ? { height: 24 } : { height: [12, 34, 12] }}
            transition={reduce ? {} : { duration: 1, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
          />
        ))}
      </div>
      <p className="mt-6 font-display text-2xl tracking-[-0.02em]">Analizando oportunidades…</p>
      <p className="mt-1 text-sm text-ink-2">Cruzando tu perfil con los desarrollos disponibles.</p>
    </div>
  );
}

function Result({
  answers,
  developments,
  leadId,
  contact,
  onRestart,
}: {
  answers: QuizAnswers;
  developments: Development[];
  leadId: string | null;
  contact: Contact;
  onRestart: () => void;
}) {
  const matches = matchDevelopments(developments, answers);
  const resumen = `${answers.uso === "invertir" ? "Invertir" : "Vivir"} · ${ZONA_LABEL[answers.zona]} · ${TIPO_LABEL[answers.tipo]}`;

  return (
    <div>
      <p className="text-sm text-ink-2">Según lo que buscas: {resumen}.</p>
      <h3 className="mt-1 font-display text-3xl leading-[1.05] tracking-[-0.02em] md:text-4xl">
        Desarrollos que corresponden a tu perfil
      </h3>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {matches.map((d, i) => (
          <ResultCard key={d.slug} d={d} rank={i + 1} />
        ))}
      </div>

      <div className="mt-8">
        <p className="font-display text-xl tracking-[-0.01em]">Solicita disponibilidad y precios</p>
        <p className="mt-1 text-sm text-ink-2">
          Déjanos tu WhatsApp y un asesor te comparte precios directo del desarrollador, sin compromiso.
        </p>
        <div className="mt-4">
          <PhoneStep
            leadId={leadId}
            contact={contact}
            context={matches[0]?.heading}
            developmentSlug={matches[0]?.slug}
          />
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

function ResultCard({ d, rank }: { d: Development; rank: number }) {
  const primary = rank === 1;
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-surface ${
        primary ? "border-cenote sm:col-span-2" : "border-hairline"
      }`}
    >
      <div className={`relative ${primary ? "h-52" : "h-40"}`}>
        <Image src={d.image} alt={d.alt} fill className="object-cover" sizes="(max-width:640px) 100vw, 50vw" />
        <span className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-full bg-espresso px-2.5 py-1 text-xs font-semibold text-canvas">
            #{rank}
          </span>
          {primary && (
            <span className="rounded-full bg-cenote px-3 py-1 text-xs font-medium text-canvas">
              Mejor opción
            </span>
          )}
        </span>
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

// Segundo paso: teléfono. Actualiza el lead ya creado en el gate (PATCH por id). Si el gate
// no pudo guardar (POST falló, leadId null), crea el lead completo ahora (fallback POST).
function PhoneStep({
  leadId,
  contact,
  context,
  developmentSlug,
}: {
  leadId: string | null;
  contact: Contact;
  context?: string;
  developmentSlug?: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const data = new FormData(e.currentTarget);
    const phone = String(data.get("phone") ?? "");
    const message = String(data.get("message") ?? "");
    setStatus("sending");
    try {
      const res = leadId
        ? await fetch("/api/leads", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: leadId, phone, message }),
          })
        : await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: contact.name,
              email: contact.email,
              phone,
              message,
              locale: "es",
              source: "form",
              sourceUrl: typeof window !== "undefined" ? window.location.pathname : undefined,
              developmentSlug,
            }),
          });
      if (!res.ok) throw new Error("request failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-start gap-3 rounded-3xl border border-hairline bg-surface p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cenote/12 text-cenote">
          <Check className="h-5 w-5" />
        </span>
        <p className="font-display text-2xl tracking-[-0.02em]">Solicitud recibida</p>
        <p className="text-ink-2">
          Un asesor te contactará con disponibilidad y precios{context ? ` de ${context}` : ""}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-hairline bg-surface p-6 md:p-8">
      <label className="block">
        <span className="text-xs uppercase tracking-[0.16em] text-ink-2">WhatsApp</span>
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          required
          autoComplete="tel"
          placeholder="999 000 0000…"
          className="mt-1.5 w-full rounded-2xl border border-hairline bg-canvas px-4 py-2.5 text-sm outline-none transition focus:border-cenote"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-xs uppercase tracking-[0.16em] text-ink-2">Mensaje (opcional)</span>
        <textarea
          name="message"
          rows={2}
          placeholder="Presupuesto aproximado, dudas…"
          className="mt-1.5 w-full resize-none rounded-2xl border border-hairline bg-canvas px-4 py-3 text-sm outline-none transition focus:border-cenote"
        />
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cenote px-6 py-3.5 text-sm font-medium text-canvas transition hover:bg-cenote-deep disabled:opacity-60"
      >
        {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {status === "sending" ? "Enviando…" : "Solicitar informes"}
      </button>

      {status === "error" && (
        <p className="mt-3 text-center text-sm text-cenote-deep">
          No se pudo enviar. Escribe por WhatsApp e inténtalo de nuevo.
        </p>
      )}
    </form>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-hairline bg-canvas px-2.5 py-1 text-xs text-ink-2">
      {children}
    </span>
  );
}
