"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { deleteZona } from "@/app/admin/(panel)/zonas/actions";
import { ConfirmDialog } from "@/components/crm/ConfirmDialog";

export function DeleteZonaButton({ id }: { id: string }) {
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
        onConfirm={() => startTransition(() => deleteZona(id))}
        title="Borrar zona"
        description="Se elimina la zona. Los desarrollos enlazados se conservan pero pierden el enlace. No se puede deshacer."
        confirmLabel="Borrar zona"
        destructive
        pending={pending}
      />
    </>
  );
}
