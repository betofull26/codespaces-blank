import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Tag, Check, Trash2 } from "lucide-react";

export interface Label {
  id: string;
  name: string;
  color: string; // tailwind bg class
  textColor: string; // tailwind text class
}

const COLOR_OPTIONS: { bg: string; text: string; ring: string; preview: string }[] = [
  { bg: "bg-blue-100",   text: "text-blue-700",   ring: "ring-blue-400",   preview: "bg-blue-500"   },
  { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-400", preview: "bg-emerald-500" },
  { bg: "bg-violet-100", text: "text-violet-700", ring: "ring-violet-400", preview: "bg-violet-500" },
  { bg: "bg-rose-100",   text: "text-rose-700",   ring: "ring-rose-400",   preview: "bg-rose-500"   },
  { bg: "bg-amber-100",  text: "text-amber-700",  ring: "ring-amber-400",  preview: "bg-amber-500"  },
  { bg: "bg-cyan-100",   text: "text-cyan-700",   ring: "ring-cyan-400",   preview: "bg-cyan-500"   },
  { bg: "bg-orange-100", text: "text-orange-700", ring: "ring-orange-400", preview: "bg-orange-500" },
  { bg: "bg-pink-100",   text: "text-pink-700",   ring: "ring-pink-400",   preview: "bg-pink-500"   },
];

const DEFAULT_LABELS: Label[] = [
  { id: "l1", name: "VIP",            color: "bg-amber-100",  textColor: "text-amber-700"  },
  { id: "l2", name: "Seguimiento",    color: "bg-blue-100",   textColor: "text-blue-700"   },
  { id: "l3", name: "Urgente",        color: "bg-rose-100",   textColor: "text-rose-700"   },
  { id: "l4", name: "Nuevo cliente",  color: "bg-emerald-100", textColor: "text-emerald-700" },
];

interface LabelsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignedIds: string[];
  onChangeAssigned: (ids: string[]) => void;
  allLabels: Label[];
  onChangeLabels: (labels: Label[]) => void;
}

export function LabelsModal({
  open, onOpenChange,
  assignedIds, onChangeAssigned,
  allLabels, onChangeLabels,
}: LabelsModalProps) {
  const [newName,       setNewName]       = useState("");
  const [selectedColor, setSelectedColor] = useState(0);
  const [creating,      setCreating]      = useState(false);

  const toggleAssign = (id: string) => {
    onChangeAssigned(
      assignedIds.includes(id)
        ? assignedIds.filter((x) => x !== id)
        : [...assignedIds, id]
    );
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const col = COLOR_OPTIONS[selectedColor];
    const label: Label = {
      id:        `l-${Date.now()}`,
      name:      newName.trim(),
      color:     col.bg,
      textColor: col.text,
    };
    onChangeLabels([...allLabels, label]);
    onChangeAssigned([...assignedIds, label.id]);
    setNewName("");
    setCreating(false);
  };

  const handleDelete = (id: string) => {
    onChangeLabels(allLabels.filter((l) => l.id !== id));
    onChangeAssigned(assignedIds.filter((x) => x !== id));
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl focus:outline-none">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-blue-600" />
              <Dialog.Title className="text-sm font-bold text-slate-800">
                Etiquetas
              </Dialog.Title>
            </div>
            <Dialog.Close className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
              <X size={15} />
            </Dialog.Close>
          </div>

          <div className="px-5 py-4 space-y-2">
            {/* Subtitle */}
            <p className="text-xs text-slate-500 mb-3">
              Selecciona las etiquetas a aplicar en esta conversación o crea nuevas.
            </p>

            {/* Label list */}
            <div className="space-y-1.5">
              {allLabels.map((label) => {
                const assigned = assignedIds.includes(label.id);
                return (
                  <div
                    key={label.id}
                    className="group flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 transition-colors hover:border-slate-200 hover:bg-slate-50"
                  >
                    {/* Toggle */}
                    <button
                      onClick={() => toggleAssign(label.id)}
                      className={[
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                        assigned
                          ? "border-blue-600 bg-blue-600"
                          : "border-slate-300 bg-white hover:border-blue-400",
                      ].join(" ")}
                    >
                      {assigned && <Check size={11} className="text-white" strokeWidth={3} />}
                    </button>

                    {/* Badge preview */}
                    <span className={[
                      "flex-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      label.color, label.textColor,
                    ].join(" ")}>
                      {label.name}
                    </span>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(label.id)}
                      className="invisible shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 group-hover:visible"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}

              {allLabels.length === 0 && !creating && (
                <p className="py-4 text-center text-xs text-slate-400">
                  No hay etiquetas. Crea la primera abajo.
                </p>
              )}
            </div>

            {/* Create new */}
            {creating ? (
              <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-3">
                <p className="text-xs font-semibold text-blue-700">Nueva etiqueta</p>

                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")  handleCreate();
                    if (e.key === "Escape") { setCreating(false); setNewName(""); }
                  }}
                  placeholder="Nombre de la etiqueta..."
                  className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-300"
                />

                {/* Color picker */}
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedColor(i)}
                      className={[
                        "h-6 w-6 rounded-full transition-all",
                        c.preview,
                        selectedColor === i ? `ring-2 ring-offset-2 ${c.ring} scale-110` : "opacity-70 hover:opacity-100",
                      ].join(" ")}
                    />
                  ))}
                </div>

                {/* Preview */}
                {newName.trim() && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Vista previa:</span>
                    <span className={[
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      COLOR_OPTIONS[selectedColor].bg,
                      COLOR_OPTIONS[selectedColor].text,
                    ].join(" ")}>
                      {newName.trim()}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
                  >
                    Crear etiqueta
                  </button>
                  <button
                    onClick={() => { setCreating(false); setNewName(""); }}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-medium text-slate-500 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
              >
                <Plus size={14} /> Crear nueva etiqueta
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t border-slate-100 px-5 py-3">
            <Dialog.Close className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700">
              Listo
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { DEFAULT_LABELS };
