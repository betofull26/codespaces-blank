import { Ticket, UserCheck, UserX, AlertCircle, TrendingUp, Users } from "lucide-react";

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  color: "blue" | "emerald" | "amber" | "slate" | "gray";
}

function KPICard({ icon, label, value, trend, color }: KPICardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-50 text-slate-600",
    gray: "bg-gray-50 text-gray-600",
  };

  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>{icon}</div>
        {trend && (
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <TrendingUp size={14} />
            {trend}
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="mt-0.5 text-sm text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export function KPICards() {
  // Datos base
  const totalAgentes = 24;
  const agentesConectados = 18;
  const agentesDesconectados = totalAgentes - agentesConectados;

  return (
    <div className="mb-5 grid grid-cols-4 gap-4">
      <KPICard
        icon={<Users size={20} />}
        label="Total de Agentes"
        value={totalAgentes}
        color="blue"
      />
      <KPICard
        icon={<UserCheck size={20} />}
        label="Agentes Conectados"
        value={agentesConectados}
        color="emerald"
      />
      <KPICard
        icon={<UserX size={20} />}
        label="Agentes Desconectados"
        value={agentesDesconectados}
        color="gray"
      />
      <KPICard
        icon={<AlertCircle size={20} />}
        label="Reasignaciones Pendientes"
        value={8}
        color="amber"
      />
    </div>
  );
}
