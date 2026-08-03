"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { descartarPost } from "@/app/admin/(panel)/contenido/actions";
import { ConfirmDialog } from "@/components/crm/ConfirmDialog";

export function DescartarPostButton({ id, yaSalio }: { id: string; yaSalio: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        className="crm-btn crm-btn-ghost crm-btn-sm"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" strokeWidth={2} /> : null}
        Descartar
      </button>
      {error && <p className="text-[12px] text-[var(--destructive)]">{error}</p>}

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() =>
          start(async () => {
            const res = await descartarPost(id);
            if ("error" in res) {
              setError(res.error);
              setOpen(false);
              return;
            }
            router.push("/admin/contenido");
          })
        }
        title="Descartar post"
        description={
          yaSalio
            ? "Este post ya se envió a Post for Me. Descartarlo solo lo quita de este panel: no lo baja de Facebook ni de Instagram."
            : "Se elimina el borrador y su imagen. No se puede deshacer."
        }
        confirmLabel="Descartar"
        destructive
        pending={pending}
      />
    </div>
  );
}
