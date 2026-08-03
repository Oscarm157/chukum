"use client";

import { useEffect, useState } from "react";

// Nombre real del desarrollo, visible SOLO si quien navega tiene sesión de admin. Sin sesión,
// /api/admin/dev-names responde 401 y este componente no renderiza nada — el nombre nunca
// aparece en el HTML servido a un visitante público (ver restricción en schema.ts).
let namesPromise: Promise<Record<string, string>> | null = null;
function fetchNames() {
  if (!namesPromise) {
    namesPromise = fetch("/api/admin/dev-names", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return namesPromise;
}

export function AdminDevName({ slug, className }: { slug: string; className?: string }) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchNames().then((names) => {
      if (alive && names[slug]) setName(names[slug]);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  if (!name) return null;
  return (
    <span className={className ?? "mt-0.5 block text-[11px] tracking-wide text-ink-2/60"}>
      {name} · solo admin
    </span>
  );
}
