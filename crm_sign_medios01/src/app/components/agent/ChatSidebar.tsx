import { useState } from "react";
import { useNavigate } from "react-router";
import { MessageSquare, Search, LogOut, ChevronDown, UserCircle2 } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import companyLogo from "../../../imports/IMG_20260602_130639_278.jpg";
import type { PanelConversation } from "./agentPanelData";
import { CURRENT_AGENT } from "./agentPanelData";
import { AgentProfileModal } from "./AgentProfileModal";

/* ─── Conversation list item ─────────────────────────── */
function ConvItem({
  conv,
  selected,
  onClick,
}: {
  conv: PanelConversation;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors",
        selected
          ? "border-l-2 border-l-blue-500 bg-blue-50"
          : "border-l-2 border-l-transparent hover:bg-slate-50",
      ].join(" ")}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={["flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white", conv.avatarColor].join(" ")}>
          {conv.clientInitials}
        </div>
        {conv.clientOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <p className="truncate text-sm font-semibold text-slate-800">{conv.clientName}</p>
          <span className={["shrink-0 text-[11px]", conv.unreadCount > 0 ? "font-semibold text-blue-600" : "text-slate-400"].join(" ")}>
            {conv.lastTime}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">{conv.topic}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="truncate text-[11px] text-slate-400">{conv.lastMessage}</p>
          {conv.unreadCount > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─── ChatSidebar ─────────────────────────────────────── */
interface ChatSidebarProps {
  conversations: PanelConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ChatSidebar({ conversations, selectedId, onSelect }: ChatSidebarProps) {
  const navigate = useNavigate();
  const [search,        setSearch]        = useState("");
  const [profileOpen,   setProfileOpen]   = useState(false);

  const filtered = conversations.filter(
    (c) =>
      c.clientName.toLowerCase().includes(search.toLowerCase()) ||
      c.topic.toLowerCase().includes(search.toLowerCase()) ||
      c.clientPhone.includes(search)
  );

  const totalUnread = conversations.reduce((a, c) => a + c.unreadCount, 0);

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex items-center border-b border-slate-200 px-5 py-4">
        <ImageWithFallback src={companyLogo} alt="SIGN Medios" className="h-9 w-auto object-contain" />
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-blue-600" />
          <span className="text-sm font-bold text-slate-800">Mis Chats</span>
        </div>
        {totalUnread > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
            {totalUnread}
          </span>
        )}
      </div>

      {/* Search */}
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2">
          <Search size={14} className="shrink-0 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar conversación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          {filtered.length} conversación{filtered.length !== 1 ? "es" : ""} asignada{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
            <MessageSquare size={32} className="opacity-30" />
            <p className="text-sm">Sin resultados</p>
          </div>
        ) : (
          filtered.map((conv) => (
            <ConvItem
              key={conv.id}
              conv={conv}
              selected={selectedId === conv.id}
              onClick={() => onSelect(conv.id)}
            />
          ))
        )}
      </div>

      {/* Agent profile — bottom */}
      <div className="border-t border-slate-200 p-3">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-slate-100 focus:outline-none">
              <div className="relative shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {CURRENT_AGENT.initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{CURRENT_AGENT.name}</p>
                <p className="truncate text-xs text-slate-500">{CURRENT_AGENT.role}</p>
              </div>
              <ChevronDown size={14} className="shrink-0 text-slate-400" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="top"
              align="start"
              sideOffset={8}
              className="z-50 min-w-[220px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
            >
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-100"
                onSelect={() => setProfileOpen(true)}
              >
                <UserCircle2 size={15} className="text-blue-500" /> Mi perfil personal
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1.5 h-px bg-slate-100" />

              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 outline-none hover:bg-red-50"
                onSelect={() => navigate("/")}
              >
                <LogOut size={15} /> Cerrar sesión
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <AgentProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        totalChats={conversations.length}
      />
    </aside>
  );
}
