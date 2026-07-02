import { useState, useMemo } from "react";
import {
  RefreshCw, Users, MessageSquare, ChevronRight, CheckCircle2,
  ArrowRight, Shuffle, AlertCircle, Info, Check, X, RotateCcw,
  UserCheck, Clock, Layers,
} from "lucide-react";
import { agentsData } from "./agentsData";
import type { Agent, Conversation } from "./types";

/* ══════════════════════════════════════════════════════
   ROUND ROBIN ALGORITHM
   Distributes conversations cyclically across targets.
══════════════════════════════════════════════════════ */
function roundRobin(
  conversations: Conversation[],
  targets: Agent[]
): Map<string, Conversation[]> {
  const map = new Map<string, Conversation[]>(targets.map((a) => [a.id, []]));
  conversations.forEach((conv, i) => {
    const target = targets[i % targets.length];
    map.get(target.id)!.push(conv);
  });
  return map;
}

/* ══════════════════════════════════════════════════════
   AVATAR COLORS (cyclic)
══════════════════════════════════════════════════════ */
const COLORS = [
  "bg-blue-600", "bg-emerald-600", "bg-purple-600",
  "bg-amber-600", "bg-rose-600", "bg-cyan-600",
  "bg-indigo-600", "bg-teal-600",
];
function agentColor(index: number) { return COLORS[index % COLORS.length]; }

/* ══════════════════════════════════════════════════════
   STATUS CONFIG
══════════════════════════════════════════════════════ */
const statusLabel: Record<string, { label: string; cls: string }> = {
  active:  { label: "Activa",    cls: "bg-emerald-100 text-emerald-700" },
  waiting: { label: "En espera", cls: "bg-amber-100 text-amber-700" },
  closed:  { label: "Cerrada",   cls: "bg-slate-100 text-slate-500" },
};

/* ══════════════════════════════════════════════════════
   STEPS
══════════════════════════════════════════════════════ */
const STEPS = [
  { n: 1, label: "Seleccionar origen" },
  { n: 2, label: "Elegir destinos" },
  { n: 3, label: "Vista previa" },
  { n: 4, label: "Confirmado" },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={[
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all",
                current > s.n
                  ? "bg-emerald-500 text-white"
                  : current === s.n
                  ? "bg-blue-600 text-white ring-4 ring-blue-100"
                  : "bg-slate-200 text-slate-500",
              ].join(" ")}
            >
              {current > s.n ? <Check size={14} /> : s.n}
            </div>
            <span
              className={[
                "mt-1 hidden text-[11px] sm:block",
                current === s.n ? "font-semibold text-blue-600" : "text-slate-500",
              ].join(" ")}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={[
                "mx-2 mb-5 h-0.5 w-10 sm:w-16 transition-all",
                current > s.n ? "bg-emerald-400" : "bg-slate-200",
              ].join(" ")}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   CONVERSATION PILL
══════════════════════════════════════════════════════ */
function ConvPill({ conv }: { conv: Conversation }) {
  const cfg = statusLabel[conv.status] ?? statusLabel.closed;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <MessageSquare size={13} className="shrink-0 text-blue-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-800">{conv.clientName}</p>
        <p className="truncate text-[11px] text-slate-500">{conv.topic}</p>
      </div>
      <span className={["shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", cfg.cls].join(" ")}>
        {cfg.label}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export function ReasignacionConversaciones() {
  const [step, setStep] = useState(1);
  const [sourceId, setSourceId] = useState<string>("");
  const [targetIds, setTargetIds] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<Map<string, Conversation[]> | null>(null);

  /* Derived data */
  const sourceAgent = useMemo(
    () => agentsData.find((a) => a.id === sourceId) ?? null,
    [sourceId]
  );

  const availableTargets = useMemo(
    () => agentsData.filter((a) => a.id !== sourceId && a.online),
    [sourceId]
  );

  const selectedTargets = useMemo(
    () => agentsData.filter((a) => targetIds.has(a.id)),
    [targetIds]
  );

  const preview = useMemo(() => {
    if (!sourceAgent || selectedTargets.length === 0) return null;
    return roundRobin(sourceAgent.conversations, selectedTargets);
  }, [sourceAgent, selectedTargets]);

  /* Handlers */
  const toggleTarget = (id: string) => {
    setTargetIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    setResult(preview);
    setConfirmed(true);
    setStep(4);
  };

  const handleReset = () => {
    setStep(1);
    setSourceId("");
    setTargetIds(new Set());
    setConfirmed(false);
    setResult(null);
  };

  /* Stat counts */
  const totalConvs   = sourceAgent?.conversations.length ?? 0;
  const totalTargets = selectedTargets.length;

  /* ── RENDER ── */
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <Shuffle size={20} className="text-blue-600" />
            Reasignación de Conversaciones
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Distribuye la cartera de un agente entre colaboradores activos usando estrategia Round Robin.
          </p>
        </div>
        {step > 1 && !confirmed && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100"
          >
            <RotateCcw size={13} /> Reiniciar
          </button>
        )}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-blue-600" />
        <p className="text-sm text-blue-800">
          <strong>Estrategia Round Robin:</strong> las conversaciones se reparten de forma cíclica y equitativa.
          Si hay 6 chats y 3 destinos, cada agente recibe exactamente 2.
          Los sobrantes se asignan empezando por el primero de la lista.
        </p>
      </div>

      {/* Step bar */}
      <div className="flex justify-center">
        <StepBar current={step} />
      </div>

      {/* ── STEP 1: Select source agent ── */}
      {step === 1 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-slate-700">
            ¿De qué agente quieres redistribuir las conversaciones?
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {agentsData.map((agent, i) => (
              <button
                key={agent.id}
                onClick={() => { setSourceId(agent.id); setTargetIds(new Set()); }}
                className={[
                  "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all",
                  sourceId === agent.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50",
                ].join(" ")}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white",
                      agentColor(i),
                    ].join(" ")}
                  >
                    {agent.initials}
                  </div>
                  <span
                    className={[
                      "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
                      agent.online ? "bg-emerald-500" : "bg-slate-400",
                    ].join(" ")}
                  />
                </div>
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{agent.name}</p>
                  <p className="text-xs text-slate-500">
                    {agent.conversations.length} conversación{agent.conversations.length !== 1 ? "es" : ""}
                  </p>
                </div>
                {sourceId === agent.id && (
                  <CheckCircle2 size={16} className="shrink-0 text-blue-600" />
                )}
              </button>
            ))}
          </div>

          {/* Source summary */}
          {sourceAgent && (
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <MessageSquare size={15} className="text-blue-500" />
                <span><strong>{totalConvs}</strong> conversaciones a redistribuir</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Clock size={15} className="text-amber-500" />
                <span>
                  <strong>{sourceAgent.conversations.filter((c) => c.status === "active").length}</strong> activas
                </span>
              </div>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!sourceId || totalConvs === 0}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-40"
            >
              Continuar <ChevronRight size={15} />
            </button>
          </div>

          {sourceId && totalConvs === 0 && (
            <p className="mt-2 flex items-center justify-end gap-1.5 text-xs text-amber-600">
              <AlertCircle size={12} />
              Este agente no tiene conversaciones para redistribuir.
            </p>
          )}
        </div>
      )}

      {/* ── STEP 2: Select target agents ── */}
      {step === 2 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              Selecciona los agentes destino (conectados)
            </p>
            <span className="text-xs text-slate-500">
              {targetIds.size} seleccionado{targetIds.size !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="mb-4 text-xs text-slate-500">
            Solo se muestran agentes activos. Puedes seleccionar uno o varios.
          </p>

          {availableTargets.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
              <Users size={32} className="opacity-30" />
              <p className="text-sm">No hay otros agentes conectados disponibles.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availableTargets.map((agent, i) => {
                const selected = targetIds.has(agent.id);
                const colorIdx = agentsData.findIndex((a) => a.id === agent.id);
                return (
                  <button
                    key={agent.id}
                    onClick={() => toggleTarget(agent.id)}
                    className={[
                      "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all",
                      selected
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="relative shrink-0">
                      <div
                        className={[
                          "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white",
                          agentColor(colorIdx),
                        ].join(" ")}
                      >
                        {agent.initials}
                      </div>
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{agent.name}</p>
                      <p className="text-xs text-slate-500">{agent.role}</p>
                    </div>
                    <div
                      className={[
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                        selected
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300 bg-white",
                      ].join(" ")}
                    >
                      {selected && <Check size={11} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Distribution preview info */}
          {targetIds.size > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center rounded-lg bg-blue-50 border border-blue-200 py-3">
                <p className="text-xl font-bold text-blue-700">{totalConvs}</p>
                <p className="text-xs text-blue-600">Conversaciones</p>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-emerald-50 border border-emerald-200 py-3">
                <p className="text-xl font-bold text-emerald-700">{targetIds.size}</p>
                <p className="text-xs text-emerald-600">Destinos</p>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-purple-50 border border-purple-200 py-3">
                <p className="text-xl font-bold text-purple-700">
                  ~{Math.ceil(totalConvs / targetIds.size)}
                </p>
                <p className="text-xs text-purple-600">Máx. por agente</p>
              </div>
            </div>
          )}

          <div className="mt-5 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100"
            >
              <ChevronRight size={14} className="rotate-180" /> Atrás
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={targetIds.size === 0}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-40"
            >
              Ver distribución <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Preview ── */}
      {step === 3 && preview && (
        <div className="flex flex-col gap-4">
          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-slate-700">Origen:</span>
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                {sourceAgent?.name}
              </span>
            </div>
            <ArrowRight size={15} className="text-slate-400" />
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedTargets.map((t, i) => (
                <span key={t.id} className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  {t.name}
                </span>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
              <Layers size={13} />
              <span>{totalConvs} conv. en {targetIds.size} agente{targetIds.size !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Distribution grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectedTargets.map((target, i) => {
              const convs = preview.get(target.id) ?? [];
              const colorIdx = agentsData.findIndex((a) => a.id === target.id);
              return (
                <div key={target.id} className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  {/* Agent header */}
                  <div className={["flex items-center gap-3 px-4 py-3 text-white", agentColor(colorIdx)].join(" ")}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                      {target.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{target.name}</p>
                      <p className="text-xs opacity-80">{target.role}</p>
                    </div>
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/25 text-sm font-bold">
                      {convs.length}
                    </div>
                  </div>

                  {/* Conversations assigned */}
                  <div className="flex flex-col gap-2 p-3">
                    {convs.length === 0 ? (
                      <p className="py-4 text-center text-xs text-slate-400">Sin asignaciones</p>
                    ) : (
                      convs.map((conv, j) => (
                        <div key={conv.id} className="flex items-start gap-2">
                          <span className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                            {j + 1}
                          </span>
                          <ConvPill conv={conv} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100"
            >
              <ChevronRight size={14} className="rotate-180" /> Modificar destinos
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow transition-all hover:bg-emerald-700"
            >
              <UserCheck size={16} /> Confirmar reasignación
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Success ── */}
      {step === 4 && result && (
        <div className="flex flex-col gap-5">
          {/* Success banner */}
          <div className="flex items-center gap-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-5 py-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="font-bold text-emerald-800">¡Reasignación completada!</p>
              <p className="mt-0.5 text-sm text-emerald-700">
                <strong>{totalConvs}</strong> conversaciones de <strong>{sourceAgent?.name}</strong> distribuidas
                equitativamente entre <strong>{targetIds.size}</strong> agente{targetIds.size !== 1 ? "s" : ""} usando Round Robin.
              </p>
            </div>
          </div>

          {/* Result grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectedTargets.map((target) => {
              const convs = result.get(target.id) ?? [];
              const colorIdx = agentsData.findIndex((a) => a.id === target.id);
              return (
                <div key={target.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className={["flex items-center gap-3 px-4 py-3 text-white", agentColor(colorIdx)].join(" ")}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                      {target.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{target.name}</p>
                      <p className="text-xs opacity-80">{target.role}</p>
                    </div>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25 text-sm font-bold">
                      {convs.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 p-3">
                    {convs.length === 0 ? (
                      <p className="py-4 text-center text-xs text-slate-400">Sin asignaciones</p>
                    ) : (
                      convs.map((conv, j) => (
                        <div key={conv.id} className="flex items-start gap-2">
                          <span className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600">
                            {j + 1}
                          </span>
                          <ConvPill conv={conv} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nueva reasignación */}
          <div className="flex justify-center">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow transition-all hover:bg-blue-700"
            >
              <RotateCcw size={15} /> Nueva reasignación
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
