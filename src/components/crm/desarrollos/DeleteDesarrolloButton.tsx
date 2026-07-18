"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { deleteDesarrollo } from "@/app/admin/(panel)/desarrollos/actions";
import { ConfirmDialog } from "@/components/crm/ConfirmDialog";

export function DeleteDesarrolloButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button type="button" disabled={pending} onClick={() => setOpen(true)} className="crm-btn crm-btn-ghost crm-btn-sm">
        {pending ? <Loader2 className="size-3.5 animate-spin" strokeWidth={2} /> : null}
        Borrar
      </button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => startTransition(() => deleteDesarrollo(id))}
        title="Borrar desarrollo"
        description="Esto elimina el desarrollo, sus modelos y sus fotos de forma permanente. No se puede deshacer."
        confirmLabel="Borrar desarrollo"
        destructive
        pending={pending}
      />
    </>
  );
}
