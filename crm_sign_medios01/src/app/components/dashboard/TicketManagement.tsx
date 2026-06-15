import { useState } from "react";
import { RefreshCw, MoreVertical, UserPlus, Filter } from "lucide-react";
import * as Switch from "@radix-ui/react-switch";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";

interface Ticket {
  id: string;
  createdAt: string;
  status: "new" | "in-progress" | "pending" | "completed";
  assignedTo: string;
  client: string;
  priority: "low" | "medium" | "high";
}

const mockTickets: Ticket[] = [
  {
    id: "TCK-1001",
    createdAt: "2026-06-02 09:15",
    status: "new",
    assignedTo: "María González",
    client: "Corporativo ABC",
    priority: "high",
  },
  {
    id: "TCK-1002",
    createdAt: "2026-06-02 09:30",
    status: "in-progress",
    assignedTo: "Juan Pérez",
    client: "Industrias XYZ",
    priority: "medium",
  },
  {
    id: "TCK-1003",
    createdAt: "2026-06-02 10:05",
    status: "pending",
    assignedTo: "Ana Martínez",
    client: "Comercial DEF",
    priority: "low",
  },
  {
    id: "TCK-1004",
    createdAt: "2026-06-02 10:22",
    status: "new",
    assignedTo: "Carlos López",
    client: "Grupo GHI",
    priority: "high",
  },
  {
    id: "TCK-1005",
    createdAt: "2026-06-02 11:10",
    status: "in-progress",
    assignedTo: "María González",
    client: "Empresa JKL",
    priority: "medium",
  },
];

const agents = [
  { id: "1", name: "María González", status: "active" },
  { id: "2", name: "Juan Pérez", status: "active" },
  { id: "3", name: "Ana Martínez", status: "active" },
  { id: "4", name: "Carlos López", status: "busy" },
  { id: "5", name: "Laura Fernández", status: "active" },
];

interface TicketManagementProps {
  selectedNode: string;
}

export function TicketManagement({ selectedNode }: TicketManagementProps) {
  const [roundRobinEnabled, setRoundRobinEnabled] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [tickets] = useState<Ticket[]>(mockTickets);

  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTickets((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });
  };

  const selectAllTickets = () => {
    if (selectedTickets.size === tickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(tickets.map((t) => t.id)));
    }
  };

  const getStatusBadge = (status: Ticket["status"]) => {
    const statusConfig = {
      new: { label: "Nuevo", class: "bg-blue-100 text-blue-700" },
      "in-progress": { label: "En Progreso", class: "bg-amber-100 text-amber-700" },
      pending: { label: "Pendiente", class: "bg-slate-100 text-slate-700" },
      completed: { label: "Completado", class: "bg-emerald-100 text-emerald-700" },
    };

    const config = statusConfig[status];
    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.class}`}
      >
        {config.label}
      </span>
    );
  };

  const getPriorityDot = (priority: Ticket["priority"]) => {
    const colors = {
      high: "bg-red-500",
      medium: "bg-amber-500",
      low: "bg-slate-400",
    };
    return <span className={`h-2 w-2 rounded-full ${colors[priority]}`}></span>;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Toolbar */}
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            Gestión de Fichas - {selectedNode}
          </h2>
          <button className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            <Filter size={16} />
            Filtros
          </button>
        </div>

        {/* Round Robin Controls */}
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <RefreshCw size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">
                Distribución Automatizada (Round Robin)
              </div>
              <div className="text-xs text-slate-600">
                {roundRobinEnabled
                  ? "Sistema activo - Asignación automática en curso"
                  : "Sistema pausado - Solo asignación manual"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Agent rotation queue */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Cola activa:</span>
              <div className="flex -space-x-2">
                {agents.slice(0, 4).map((agent, i) => (
                  <div
                    key={agent.id}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-600 text-xs font-semibold text-white"
                    title={agent.name}
                  >
                    {agent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                ))}
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-400 text-xs font-semibold text-white">
                  +{agents.length - 4}
                </div>
              </div>
            </div>

            {/* Toggle switch */}
            <Switch.Root
              checked={roundRobinEnabled}
              onCheckedChange={setRoundRobinEnabled}
              className={[
                "relative h-7 w-12 cursor-pointer rounded-full transition-colors",
                roundRobinEnabled ? "bg-emerald-600" : "bg-slate-300",
              ].join(" ")}
            >
              <Switch.Thumb
                className={[
                  "block h-5 w-5 rounded-full bg-white shadow-md transition-transform",
                  roundRobinEnabled ? "translate-x-6" : "translate-x-1",
                ].join(" ")}
              />
            </Switch.Root>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedTickets.size > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
            <span className="text-sm font-medium text-slate-700">
              {selectedTickets.size} ficha(s) seleccionada(s)
            </span>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
                  <UserPlus size={16} />
                  Reasignar Fichas
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-[240px] rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                  sideOffset={5}
                  align="end"
                >
                  <div className="mb-2 px-2 py-1 text-xs font-semibold uppercase text-slate-500">
                    Seleccionar agente
                  </div>
                  {agents.map((agent) => (
                    <DropdownMenu.Item
                      key={agent.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 outline-none transition-colors hover:bg-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-600 text-xs font-semibold text-white">
                          {agent.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span>{agent.name}</span>
                      </div>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          agent.status === "active" ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      ></span>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        )}
      </div>

      {/* Ticket table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left">
                <Checkbox.Root
                  checked={selectedTickets.size === tickets.length && tickets.length > 0}
                  onCheckedChange={selectAllTickets}
                  className={[
                    "flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded-md border transition-all",
                    selectedTickets.size === tickets.length && tickets.length > 0
                      ? "border-blue-600 bg-blue-600"
                      : "border-slate-300 bg-white hover:border-slate-400",
                  ].join(" ")}
                >
                  <Checkbox.Indicator>
                    <Check size={11} strokeWidth={3} className="text-white" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Creado
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Asignado a
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
                Prioridad
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className={[
                  "transition-colors",
                  selectedTickets.has(ticket.id) ? "bg-blue-50" : "hover:bg-slate-50",
                ].join(" ")}
              >
                <td className="px-5 py-3">
                  <Checkbox.Root
                    checked={selectedTickets.has(ticket.id)}
                    onCheckedChange={() => toggleTicketSelection(ticket.id)}
                    className={[
                      "flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded-md border transition-all",
                      selectedTickets.has(ticket.id)
                        ? "border-blue-600 bg-blue-600"
                        : "border-slate-300 bg-white hover:border-slate-400",
                    ].join(" ")}
                  >
                    <Checkbox.Indicator>
                      <Check size={11} strokeWidth={3} className="text-white" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                  {ticket.id}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{ticket.createdAt}</td>
                <td className="px-4 py-3 text-sm text-slate-800">{ticket.client}</td>
                <td className="px-4 py-3">{getStatusBadge(ticket.status)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{ticket.assignedTo}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">{getPriorityDot(ticket.priority)}</div>
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                        <MoreVertical size={18} />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="z-50 min-w-[160px] rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
                        sideOffset={5}
                        align="end"
                      >
                        <DropdownMenu.Item className="cursor-pointer rounded px-2 py-1.5 text-sm text-slate-700 outline-none hover:bg-slate-100">
                          Ver detalles
                        </DropdownMenu.Item>
                        <DropdownMenu.Item className="cursor-pointer rounded px-2 py-1.5 text-sm text-slate-700 outline-none hover:bg-slate-100">
                          Reasignar
                        </DropdownMenu.Item>
                        <DropdownMenu.Item className="cursor-pointer rounded px-2 py-1.5 text-sm text-slate-700 outline-none hover:bg-slate-100">
                          Cambiar prioridad
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="my-1 h-px bg-slate-200" />
                        <DropdownMenu.Item className="cursor-pointer rounded px-2 py-1.5 text-sm text-red-600 outline-none hover:bg-red-50">
                          Cerrar ficha
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-5 py-3">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Mostrando {tickets.length} de {tickets.length} fichas</span>
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-300 px-3 py-1 transition-colors hover:bg-slate-50">
              Anterior
            </button>
            <button className="rounded-lg border border-slate-300 px-3 py-1 transition-colors hover:bg-slate-50">
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
