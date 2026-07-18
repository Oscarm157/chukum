"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import type { Unit } from "@/lib/desarrollos-data";
import { Modal } from "@/components/crm/Modal";
import { ConfirmDialog } from "@/components/crm/ConfirmDialog";
import { addModelo, updateModelo, deleteModelo } from "@/app/admin/(panel)/desarrollos/actions";

const label = "mb-1.5 block text-[12.5px] font-medium text-[var(--crm-ink-soft)]";
const TIPOS = [
  ["terreno", "Terreno"],
  ["casa", "Casa"],
  ["departamento", "Departamento"],
  ["townhouse", "Townhouse"],
  ["local_comercial", "Local comercial"],
] as const;
const STATUSES = [
  ["disponible", "Disponible"],
  ["apartado", "Apartado"],
  ["vendido", "Vendido"],
] as const;
const TIPO_LABEL = Object.fromEntries(TIPOS) as Record<string, string>;
const STATUS_LABEL = Object.fromEntries(STATUSES) as Record<string, string>;

const money = (n: number | null) =>
  n == null ? "—" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

function ModeloFields({ unit }: { unit?: Unit }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className={label} htmlFor="unitCode">Nombre / código</label>
        <input id="unitCode" name="unitCode" defaultValue={unit?.unitCode ?? ""} className="crm-input" placeholder="Modelo A" />
      </div>
      <div>
        <label className={label} htmlFor="unitType">Tipo</label>
        <select id="unitType" name="unitType" defaultValue={unit?.unitType ?? "casa"} className="crm-select">
          {TIPOS.map(([val, l]) => <option key={val} value={val}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="status">Estatus</label>
        <select id="status" name="status" defaultValue={unit?.status ?? "disponible"} className="crm-select">
          {STATUSES.map(([val, l]) => <option key={val} value={val}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="priceMxn">Precio (MXN)</label>
        <input id="priceMxn" name="priceMxn" inputMode="numeric" defaultValue={unit?.priceMxn ?? ""} className="crm-input crm-num" />
      </div>
      <div>
        <label className={label} htmlFor="areaM2">Área (m²)</label>
        <input id="areaM2" name="areaM2" inputMode="decimal" defaultValue={unit?.areaM2 ?? ""} className="crm-input crm-num" />
      </div>
      <div>
        <label className={label} htmlFor="bedrooms">Recámaras</label>
        <input id="bedrooms" name="bedrooms" inputMode="numeric" defaultValue={unit?.bedrooms ?? ""} className="crm-input crm-num" />
      </div>
      <div>
        <label className={label} htmlFor="bathrooms">Baños</label>
        <input id="bathrooms" name="bathrooms" inputMode="decimal" defaultValue={unit?.bathrooms ?? ""} className="crm-input crm-num" />
      </div>
      <div>
        <label className={label} htmlFor="levels">Niveles</label>
        <input id="levels" name="levels" inputMode="numeric" defaultValue={unit?.levels ?? ""} className="crm-input crm-num" />
      </div>
      <div className="sm:col-span-2">
        <label className={label} htmlFor="notes">Notas</label>
        <textarea id="notes" name="notes" rows={2} defaultValue={unit?.notes ?? ""} className="crm-textarea" />
      </div>
    </div>
  );
}

export function ModelosEditor({ devId, units }: { devId: string; units: Unit[] }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [deleting, setDeleting] = useState<Unit | null>(null);
  const [pending, start] = useTransition();

  function submitAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      await addModelo(devId, fd);
      setAdding(false);
    });
  }
  function submitEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const fd = new FormData(e.currentTarget);
    const id = editing.id;
    start(async () => {
      await updateModelo(devId, id, fd);
      setEditing(null);
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="crm-num text-[12px] text-[var(--crm-ink-mute)]">
          {units.length} {units.length === 1 ? "modelo" : "modelos"}
        </span>
        <button type="button" onClick={() => setAdding(true)} className="crm-btn crm-btn-secondary crm-btn-sm">
          <Plus className="size-3.5" strokeWidth={2} /> Agregar modelo
        </button>
      </div>

      {units.length === 0 ? (
        <div className="crm-card p-6 text-[13px] text-[var(--crm-ink-mute)]">Aún no hay modelos en este desarrollo.</div>
      ) : (
        <div className="crm-card overflow-hidden">
          <table className="crm-table">
            <thead className="crm-thead">
              <tr>
                <th className="crm-th">Modelo</th>
                <th className="crm-th">Tipo</th>
                <th className="crm-th">Estatus</th>
                <th className="crm-th text-right">Precio</th>
                <th className="crm-th text-right">m²</th>
                <th className="crm-th text-right">Rec.</th>
                <th className="crm-th"></th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id} className="crm-row border-t border-[var(--crm-line)]">
                  <td className="crm-td font-medium text-[var(--crm-ink)]">{u.unitCode ?? "—"}</td>
                  <td className="crm-td text-[13px] text-[var(--crm-ink-soft)]">{TIPO_LABEL[u.unitType]}</td>
                  <td className="crm-td"><span className="crm-badge">{STATUS_LABEL[u.status]}</span></td>
                  <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink-soft)]">{money(u.priceMxn)}</td>
                  <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink-soft)]">{u.areaM2 ?? "—"}</td>
                  <td className="crm-td crm-num text-right text-[13px] text-[var(--crm-ink-soft)]">{u.bedrooms ?? "—"}</td>
                  <td className="crm-td text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => setEditing(u)} className="crm-btn crm-btn-ghost crm-btn-sm" aria-label="Editar modelo">
                        <Pencil className="size-3.5" strokeWidth={2} />
                      </button>
                      <button type="button" onClick={() => setDeleting(u)} className="crm-btn crm-btn-ghost crm-btn-sm" aria-label="Borrar modelo">
                        <Trash2 className="size-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Agregar modelo" maxWidth={620}>
        <form onSubmit={submitAdd}>
          <ModeloFields />
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setAdding(false)} className="crm-btn crm-btn-secondary crm-btn-sm">Cancelar</button>
            <button type="submit" disabled={pending} className="crm-btn crm-btn-primary crm-btn-sm">
              {pending && <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />} Guardar modelo
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar modelo" maxWidth={620}>
        <form onSubmit={submitEdit}>
          <ModeloFields unit={editing ?? undefined} />
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(null)} className="crm-btn crm-btn-secondary crm-btn-sm">Cancelar</button>
            <button type="submit" disabled={pending} className="crm-btn crm-btn-primary crm-btn-sm">
              {pending && <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />} Guardar cambios
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          const id = deleting?.id;
          if (!id) return;
          start(async () => {
            await deleteModelo(devId, id);
            setDeleting(null);
          });
        }}
        title="Borrar modelo"
        description="Se elimina este modelo del desarrollo. No se puede deshacer."
        confirmLabel="Borrar modelo"
        destructive
        pending={pending}
      />
    </div>
  );
}
