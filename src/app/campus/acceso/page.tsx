import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { KB_COOKIE, expectedToken, constantTimeEqual } from "@/lib/campus-gate";

export const dynamic = "force-dynamic";

export default async function AccesoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [jar, params, expected] = await Promise.all([
    cookies(),
    searchParams,
    expectedToken(),
  ]);

  const cookie = jar.get(KB_COOKIE)?.value;
  if (expected && cookie && constantTimeEqual(cookie, expected)) redirect("/campus");

  const hasError = params.error === "1";

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-16">
      <div className="kb-fade w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5 text-ink-mute">
          <Lock className="size-4" />
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em]">
            Acceso privado
          </span>
        </div>

        <h1 className="font-serif text-[2rem] leading-[1.1] tracking-tight text-ink">
          Campus ORVE
        </h1>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
          Base de conocimientos interna. Escribe la contraseña para entrar.
        </p>

        <form action="/campus/acceso/unlock" method="POST" className="mt-7">
          <label htmlFor="pw" className="sr-only">
            Contraseña
          </label>
          <input
            id="pw"
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            placeholder="Contraseña"
            className="w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-[0.95rem] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-faint focus:border-accent focus:ring-4 focus:ring-accent-tint"
          />

          {hasError && (
            <p className="mt-2.5 text-sm text-destructive">
              Contraseña incorrecta. Intenta de nuevo.
            </p>
          )}

          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-accent px-4 py-3 text-[0.95rem] font-semibold text-primary-foreground transition-[background-color,transform] hover:bg-accent-soft active:translate-y-px"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
