import { useDrop } from "react-dnd";
import { User, X } from "lucide-react";
import type { ClientContact, Agent } from "./DirectorioManagement";
import { DraggableContact } from "./DraggableContact";

interface AgentDropZoneProps {
  agent: Agent;
  contacts: ClientContact[];
  onAssign: (contactId: string, agentId: string | null) => void;
  onEdit: (contact: ClientContact) => void;
  onDelete: (id: string) => void;
}

export function AgentDropZone({
  agent,
  contacts,
  onAssign,
  onEdit,
  onDelete,
}: AgentDropZoneProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: "CONTACT",
    drop: (item: { contactId: string }) => {
      onAssign(item.contactId, agent.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const isActive = isOver && canDrop;

  return (
    <div
      ref={drop}
      className={[
        "rounded-xl border-2 border-dashed bg-white p-4 transition-all",
        isActive
          ? "border-blue-500 bg-blue-50"
          : canDrop
          ? "border-slate-300"
          : "border-slate-200",
      ].join(" ")}
    >
      {/* Agent Header */}
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${agent.color} text-white`}
        >
          <User size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">{agent.name}</h3>
          <p className="text-xs text-slate-600">{contacts.length} contacto(s) asignado(s)</p>
        </div>
      </div>

      {/* Assigned Contacts */}
      <div className="space-y-2">
        {contacts.map((contact) => (
          <div key={contact.id} className="relative">
            <DraggableContact contact={contact} onEdit={onEdit} onDelete={onDelete} showActions={false} />
            <button
              onClick={() => onAssign(contact.id, null)}
              className="absolute right-2 top-2 rounded-full bg-slate-100 p-1 text-slate-600 opacity-0 transition-all hover:bg-red-100 hover:text-red-600 group-hover:opacity-100"
              title="Desasignar"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {contacts.length === 0 && (
        <div
          className={[
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-6 text-center transition-colors",
            isActive ? "border-blue-400 bg-blue-100" : "border-slate-200 bg-slate-50",
          ].join(" ")}
        >
          <User size={24} className={isActive ? "text-blue-600" : "text-slate-400"} />
          <p className={`mt-2 text-xs ${isActive ? "text-blue-700" : "text-slate-500"}`}>
            {isActive ? "Suelta aquí para asignar" : "Sin contactos asignados"}
          </p>
        </div>
      )}
    </div>
  );
}
