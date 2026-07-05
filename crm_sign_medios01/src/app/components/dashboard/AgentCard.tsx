import { Phone } from "lucide-react";
import type { Agent } from "./types";

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  onClick: (agent: Agent) => void;
}

export function AgentCard({ agent, isSelected, onClick }: AgentCardProps) {
  return (
    <div
      onClick={() => onClick(agent)}
      className={[
        "relative flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition-all hover:shadow-md",
        isSelected
          ? "border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-300"
          : "border-slate-200 bg-white hover:border-blue-200",
      ].join(" ")}
    >
      {/* Avatar + status dot */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-base font-bold text-white shadow-sm">
            {agent.initials}
          </div>
          <span
            className={[
              "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm",
              agent.online ? "bg-emerald-500" : "bg-slate-400",
            ].join(" ")}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800">{agent.name}</p>
          <p className="truncate text-xs text-slate-500">{agent.role}</p>
        </div>
      </div>

      {/* Online badge */}
      <div className="flex items-center justify-between">
        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
            agent.online
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500",
          ].join(" ")}
        >
          <span
            className={[
              "h-1.5 w-1.5 rounded-full",
              agent.online ? "bg-emerald-500" : "bg-slate-400",
            ].join(" ")}
          />
          {agent.online ? "Conectado" : "Desconectado"}
        </span>

      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Phone size={11} />
          <span>{agent.phone}</span>
        </div>
      </div>
    </div>
  );
}
