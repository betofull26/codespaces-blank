import { useDrag } from "react-dnd";
import { Phone, User, GripVertical, Pencil, Trash2 } from "lucide-react";
import type { ClientContact } from "./DirectorioManagement";

interface DraggableContactProps {
  contact: ClientContact;
  onEdit: (contact: ClientContact) => void;
  onDelete: (id: string) => void;
  showActions?: boolean;
}

export function DraggableContact({
  contact,
  onEdit,
  onDelete,
  showActions = true,
}: DraggableContactProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "CONTACT",
    item: { contactId: contact.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={[
        "group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-all",
        isDragging ? "opacity-50" : "hover:border-slate-300 hover:shadow-sm cursor-move",
      ].join(" ")}
    >
      <GripVertical size={16} className="shrink-0 text-slate-400" />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <User size={20} />
      </div>
      <div className="flex-1 overflow-hidden">
        <h3 className="truncate text-sm font-semibold text-slate-800">{contact.name}</h3>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600">
          <Phone size={12} />
          <span className="truncate">{contact.phone}</span>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(contact)}
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(contact.id)}
            className="rounded p-1.5 text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
