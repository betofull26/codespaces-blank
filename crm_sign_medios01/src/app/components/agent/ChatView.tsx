import { useState, useRef, useEffect } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  MoreVertical, Search, Paperclip,
  Smile, Send, Lock, MessageSquare, StickyNote,
  CheckCheck, Check, Clock, User as UserIcon,
  UserPlus, Edit3, CheckCircle2, Tag, Trash2, X,
  FileText, Image as ImageIcon,
} from "lucide-react";
import type { PanelConversation, PanelMessage, PanelAttachment } from "./agentPanelData";
import { CURRENT_AGENT } from "./agentPanelData";
import { ContactPanel } from "./ContactPanel";
import { LabelsModal, DEFAULT_LABELS } from "./LabelsModal";
import type { Label } from "./LabelsModal";

/* ─── Input mode ─────────────────────────────────────── */
type InputMode = "whatsapp" | "note";

/* ─── Message status icon ────────────────────────────── */
function MsgStatus({ status }: { status?: PanelMessage["status"] }) {
  if (!status) return null;
  if (status === "read")      return <CheckCheck size={13} className="text-blue-300" />;
  if (status === "delivered") return <CheckCheck size={13} className="text-white/60" />;
  return <Check size={13} className="text-white/60" />;
}

/* ─── Inline text editor used inside bubbles ─────────── */
function BubbleEditor({ value, onSave, onCancel, dark }: {
  value: string;
  onSave: (t: string) => void;
  onCancel: () => void;
  dark?: boolean;
}) {
  const [val, setVal] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.setSelectionRange(val.length, val.length);
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        ref={ref}
        value={val}
        rows={2}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (val.trim()) onSave(val.trim()); }
          if (e.key === "Escape") onCancel();
        }}
        className={[
          "w-full resize-none rounded-lg border px-2 py-1.5 text-sm outline-none focus:ring-1",
          dark
            ? "border-white/30 bg-white/10 text-white placeholder:text-white/50 focus:ring-white/40"
            : "border-amber-300 bg-amber-50 text-amber-900 focus:ring-amber-400",
        ].join(" ")}
      />
      <div className="flex gap-1.5">
        <button
          onClick={() => val.trim() && onSave(val.trim())}
          className={[
            "flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors",
            dark ? "bg-white/20 text-white hover:bg-white/30" : "bg-amber-500 text-white hover:bg-amber-600",
          ].join(" ")}
        >
          <Check size={11} /> Guardar
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 transition-colors hover:bg-slate-100"
        >
          <X size={11} /> Cancelar
        </button>
      </div>
    </div>
  );
}

/* ─── Single message bubble ─────────────────────────── */
function Bubble({
  msg, conv, onEdit, onDelete,
}: {
  msg: PanelMessage;
  conv: PanelConversation;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [hovered,  setHovered]  = useState(false);
  const [editing,  setEditing]  = useState(false);

  const isOut  = msg.type === "whatsapp_out";
  const isNote = msg.type === "internal_note";
  const isIn   = msg.type === "whatsapp_in";
  const canAct = isOut || isNote; // incoming client messages are read-only

  const handleSave = (text: string) => {
    onEdit(msg.id, text);
    setEditing(false);
  };

  /* ── Internal note ── */
  if (isNote) {
    return (
      <div
        className="group flex justify-center px-4 py-1"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative flex max-w-[85%] flex-col rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 shadow-sm">
          {/* Actions */}
          {canAct && hovered && !editing && (
            <div className="absolute -top-7 right-0 flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1 py-0.5 shadow-md">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600"
              >
                <Edit3 size={11} /> Editar
              </button>
              <div className="h-3 w-px bg-slate-200" />
              <button
                onClick={() => onDelete(msg.id)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={11} /> Eliminar
              </button>
            </div>
          )}

          <div className="mb-1.5 flex items-center gap-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-white">
              {msg.authorInitials}
            </div>
            <span className="text-[11px] font-semibold text-amber-800">{msg.authorName}</span>
            <span className="flex items-center gap-0.5 rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] text-amber-700">
              <Lock size={8} /> Nota interna
            </span>
            <span className="ml-auto flex items-center gap-0.5 text-[10px] text-amber-500">
              <Clock size={9} />{msg.time}
            </span>
          </div>

          {editing ? (
            <BubbleEditor value={msg.text} onSave={handleSave} onCancel={() => setEditing(false)} />
          ) : (
            <p className="text-xs leading-relaxed text-amber-900">{msg.text}</p>
          )}
        </div>
      </div>
    );
  }

  /* ── Outgoing WhatsApp ── */
  if (isOut) {
    return (
      <div className="flex justify-end px-4 py-0.5">
        <div className="flex max-w-[70%] flex-col items-end gap-1">
          {msg.attachment && (
            <AttachmentBubble attachment={msg.attachment} dark />
          )}
          {msg.text && (
            <div className="rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 shadow-sm">
              <p className="text-sm leading-relaxed text-white">{msg.text}</p>
            </div>
          )}
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            {msg.time}<MsgStatus status={msg.status} />
          </div>
        </div>
      </div>
    );
  }

  /* ── Incoming WhatsApp (read-only) ── */
  return (
    <div className="flex items-end gap-2 px-4 py-0.5">
      <div className={["flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white", conv.avatarColor].join(" ")}>
        {conv.clientInitials}
      </div>
      <div className="flex max-w-[70%] flex-col">
        <div className="rounded-2xl rounded-tl-sm border border-slate-100 bg-white px-4 py-2.5 shadow-sm">
          <p className="text-sm leading-relaxed text-slate-800">{msg.text}</p>
        </div>
        <p className="mt-0.5 text-[10px] text-slate-400">{msg.time}</p>
      </div>
    </div>
  );
}

/* ─── Attachment preview bubble ──────────────────────── */
function AttachmentBubble({ attachment, dark }: { attachment: PanelAttachment; dark?: boolean }) {
  if (attachment.isImage) {
    return (
      <div className="overflow-hidden rounded-xl shadow-sm">
        <img src={attachment.url} alt={attachment.name} className="max-h-48 max-w-full object-cover" />
      </div>
    );
  }
  return (
    <div className={[
      "flex items-center gap-2.5 rounded-xl px-3 py-2.5 shadow-sm",
      dark ? "bg-blue-700" : "bg-amber-100 border border-amber-300",
    ].join(" ")}>
      <FileText size={20} className={dark ? "text-blue-200" : "text-amber-600"} />
      <div className="min-w-0">
        <p className={["truncate text-xs font-medium max-w-[180px]", dark ? "text-white" : "text-amber-900"].join(" ")}>{attachment.name}</p>
        {attachment.size && <p className={["text-[10px]", dark ? "text-blue-300" : "text-amber-600"].join(" ")}>{attachment.size}</p>}
      </div>
    </div>
  );
}

/* ─── Emoji picker data — full WhatsApp set ──────────── */
const EMOJI_GROUPS = [
  {
    label: "⭐ Top",
    emojis: ["😊","😂","🤣","❤️","😍","🥰","😘","👍","🙏","😭","😅","😁","🔥","🥺","💀","✨","🎉","💯","🤦","🤷","😩","😤","🤩","🥳","😎","🤗","😏","🫶","💪","🙌"],
  },
  {
    label: "😀 Caras",
    emojis: [
      "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","🫠","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","🫨","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥸","🥳","😎","🤓","🧐","😕","🫤","😟","🙁","☹️","😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖",
    ],
  },
  {
    label: "👋 Gestos",
    emojis: [
      "👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","🫷","🫸","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🧠","🫀","🫁","🦷","🦴","👀","👁️","👅","👄","🫦","💋","👣",
    ],
  },
  {
    label: "🧑 Personas",
    emojis: [
      "👶","🧒","👦","👧","🧑","👱","👨","🧔","👩","🧓","👴","👵","🙍","🙎","🙅","🙆","💁","🙋","🧏","🙇","🤦","🤷","👮","🕵️","💂","🥷","👷","🫅","🤴","👸","👳","👲","🧕","🤵","👰","🤰","🫃","🫄","🤱","👼","🎅","🤶","🧑‍🎄","🦸","🦹","🧙","🧝","🧛","🧟","🧞","🧜","🧚","🧌","👫","👬","👭","💏","💑","👪","🗣️","👤","👥","🫂",
    ],
  },
  {
    label: "🐶 Animales",
    emojis: [
      "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🕷️","🦂","🐢","🐍","🦎","🐊","🐸","🦕","🦖","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🦭","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔","🐾","🐉","🐲","🌵","🎄","🌲","🌳","🌴","🪵","🌱","🌿","☘️","🍀","🎍","🎋","🍃","🍂","🍁","🪺","🪹","🍄","🌾","💐","🌷","🌹","🥀","🪷","🌺","🌸","🌼","🌻","🌞","🌝","🌛","🌜","🌚","🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘","🌙","🌟","⭐","🌠","🌌","⛅","🌤️","🌥️","🌦️","🌧️","⛈️","🌩️","🌨️","❄️","💨","🌬️","🌀","🌈","🌂","☂️","☔","⛱️","⚡","❄️","🔥","💧","🌊",
    ],
  },
  {
    label: "🍎 Comida",
    emojis: [
      "🍎","🍊","🍋","🍋‍🟩","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🧄","🧅","🥔","🍠","🫚","🥐","🥖","🫓","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕","🫔","🌮","🌯","🥙","🧆","🥚","🍿","🧂","🥫","🍱","🍘","🍙","🍚","🍛","🍜","🍝","🍠","🍢","🍣","🍤","🍥","🥮","🍡","🥟","🥠","🥡","🦀","🦞","🦐","🦑","🦪","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍮","🍯","🍼","🥛","☕","🫖","🍵","🧃","🥤","🧋","🍶","🍺","🍻","🥂","🍷","🫗","🥃","🍸","🍹","🧉","🍾","🧊","🥄","🍴","🍽️","🥢","🫙",
    ],
  },
  {
    label: "✈️ Viajes",
    emojis: [
      "🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍️","🛵","🛺","🚲","🛴","🛹","🛼","🚏","🛣️","🛤️","⛽","🚨","🚥","🚦","🛑","🚧","⚓","🛟","⛵","🚤","🛥️","🛳️","⛴️","🚢","✈️","🛩️","🛫","🛬","🪂","💺","🚁","🚟","🚠","🚡","🛰️","🚀","🛸","🪐","🌍","🌎","🌏","🌐","🗺️","🧭","🏔️","⛰️","🌋","🗻","🏕️","🏖️","🏜️","🏝️","🏞️","🏟️","🏛️","🏗️","🧱","🪨","🪵","🛖","🏘️","🏚️","🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏯","🏰","💒","🗼","🗽","⛪","🕌","🛕","🕍","⛩️","🕋","⛲","⛺","🌁","🌃","🏙️","🌄","🌅","🌆","🌇","🌉","🌌","🌠","🎇","🎆","🗿",
    ],
  },
  {
    label: "⚽ Actividades",
    emojis: [
      "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🥍","🏑","🏏","🪃","🥅","⛳","🪁","🛝","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌","🎿","⛷️","🏂","🪂","🏋️","🤼","🤸","⛹️","🤺","🤾","🏌️","🏇","🧘","🏄","🏊","🤽","🚣","🧗","🚴","🏆","🥇","🥈","🥉","🏅","🎖️","🎗️","🎫","🎟️","🎪","🤹","🎭","🎬","🎤","🎧","🎼","🎵","🎶","🎷","🪗","🎸","🎹","🎺","🎻","🪘","🥁","🪦","🎲","♟️","🎯","🎳","🎮","🎰","🧩",
    ],
  },
  {
    label: "💡 Objetos",
    emojis: [
      "📱","💻","🖥️","🖨️","⌨️","🖱️","🖲️","💽","💾","💿","📀","🧮","📺","📷","📸","📹","🎥","📽️","🎞️","📞","☎️","📟","📠","📺","📻","🧭","⏱️","⏲️","⏰","🕰️","⌚","💡","🔦","🕯️","🪔","🧯","🛢️","💰","💴","💵","💶","💷","💸","💳","🧾","📊","📈","📉","🗂️","📁","📂","🗂️","📝","📋","📌","📍","📎","🖇️","✂️","🗃️","🗄️","🗑️","🔒","🔓","🔏","🔐","🔑","🗝️","🔨","🪓","⛏️","⚒️","🛠️","🗡️","⚔️","🛡️","🔧","🔩","⚙️","🗜️","🪤","🧲","🔮","🪄","🔭","🔬","🩺","💊","🩹","🩼","🪜","🧲","🪣","🧪","🧫","🧬","🔭","📡","🛰️","💉","🩻","🧸","🪆","🖼️","🪞","🪟","🛋️","🪑","🚽","🪠","🚿","🛁","🧴","🧷","🧹","🧺","🧻","🪣","🧼","🫧","🪥","🧽","🪒","🧴","🛒","🚪","🪤","🛏️","🖼️","🪑","📦","📫","📪","📬","📭","📮","📯","📜","📃","📄","📑","🗒️","🗓️","📆","📅","🗑️","📇","📋","📌","📍","✒️","✏️","📏","📐","✂️",
    ],
  },
  {
    label: "❤️ Símbolos",
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🪯","☯️","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","🆔","⚛️","🉑","☢️","☣️","📴","📳","🈶","🈚","🈸","🈺","🈷️","✴️","🆚","💮","🉐","㊙️","㊗️","🈴","🈵","🈹","🈲","🅰️","🅱️","🆎","🆑","🅾️","🆘","❌","⭕","🛑","⛔","📛","🚫","💯","💢","♨️","🚷","🚯","🚳","🚱","🔞","📵","🔕","🔇","🔈","🔉","🔊","📢","📣","🔔","🔕","🎵","🎶","⚠️","🚸","🔅","🔆","📶","🛜","📳","📴","✅","❎","🆗","🆙","🆒","🆕","🆓","🔟","🔠","🔡","🔢","🔣","🔤","🅰️","🅱️","🆎","🆑","🅾️","🆘","⁉️","❓","❔","❕","❗","🔱","⚜️","🏁","🚩","🎌","🏴","🏳️","🏳️‍🌈","🏳️‍⚧️","🏴‍☠️",
    ],
  },
];

/* ─── Hybrid message bar ─────────────────────────────── */
function HybridBar({ mode, onModeChange, onSend }: {
  mode: InputMode;
  onModeChange: (m: InputMode) => void;
  onSend: (text: string, type: InputMode, attachment?: PanelAttachment) => void;
}) {
  const [text,        setText]        = useState("");
  const [emojiOpen,   setEmojiOpen]   = useState(false);
  const [emojiTab,    setEmojiTab]    = useState(0);
  const [attachment,  setAttachment]  = useState<PanelAttachment | null>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef     = useRef<HTMLDivElement>(null);
  const isNote = mode === "note";

  /* Close emoji picker on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSend = () => {
    if (!text.trim() && !attachment) return;
    onSend(text.trim(), mode, attachment ?? undefined);
    setText("");
    setAttachment(null);
    textareaRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current;
    if (!ta) { setText((t) => t + emoji); return; }
    const start = ta.selectionStart ?? text.length;
    const end   = ta.selectionEnd   ?? text.length;
    const next  = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url     = URL.createObjectURL(file);
    const isImage = file.type.startsWith("image/");
    const size    = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    setAttachment({ name: file.name, url, isImage, size });
    e.target.value = "";
  };

  const canSend = text.trim().length > 0 || attachment !== null;

  return (
    <div className={["border-t transition-colors duration-200", isNote ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"].join(" ")}>
      {/* Mode toggle */}
      <div className="flex gap-1 border-b border-inherit px-4 pt-2">
        <button
          onClick={() => onModeChange("whatsapp")}
          className={["flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs font-medium transition-all", !isNote ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-blue-600"].join(" ")}
        >
          <MessageSquare size={12} />Mensaje WhatsApp
        </button>
        <button
          onClick={() => onModeChange("note")}
          className={["flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs font-medium transition-all", isNote ? "bg-amber-400 text-white shadow-sm" : "text-slate-500 hover:text-amber-600"].join(" ")}
        >
          <StickyNote size={12} />Nota Interna<Lock size={10} className="opacity-70" />
        </button>
      </div>

      {isNote && (
        <div className="px-4 pt-2 pb-1">
          <p className="flex items-center gap-1.5 text-[11px] text-amber-700">
            <Lock size={10} />Solo visible para el equipo — el cliente no verá esta nota
          </p>
        </div>
      )}

      {/* Attachment preview */}
      {attachment && (
        <div className="flex items-center gap-2 px-4 pt-2">
          {attachment.isImage
            ? <div className="relative">
                <img src={attachment.url} alt={attachment.name} className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
                <button onClick={() => setAttachment(null)} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-white hover:bg-slate-900">
                  <X size={10} />
                </button>
              </div>
            : <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <FileText size={16} className="text-slate-500" />
                <div>
                  <p className="max-w-[200px] truncate text-xs font-medium text-slate-700">{attachment.name}</p>
                  <p className="text-[10px] text-slate-400">{attachment.size}</p>
                </div>
                <button onClick={() => setAttachment(null)} className="ml-1 rounded p-0.5 text-slate-400 hover:text-red-500"><X size={12} /></button>
              </div>
          }
        </div>
      )}

      <div className="relative flex items-end gap-2 px-4 pb-3 pt-2">
        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" />

        {!isNote && (
          <div className="flex shrink-0 items-center gap-1 pb-1">
            {/* Attach */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
              title="Adjuntar archivo"
            >
              <Paperclip size={18} />
            </button>

            {/* Emoji */}
            <div ref={emojiRef} className="relative">
              <button
                onClick={() => setEmojiOpen((v) => !v)}
                className={["rounded-full p-2 transition-colors hover:bg-slate-100", emojiOpen ? "text-amber-500" : "text-slate-400 hover:text-amber-500"].join(" ")}
                title="Emojis"
              >
                <Smile size={18} />
              </button>

              {/* Emoji popover */}
              {emojiOpen && (
                <div className="absolute bottom-12 left-0 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col" style={{ height: "340px" }}>
                  {/* Tab bar */}
                  <div className="flex shrink-0 overflow-x-auto border-b border-slate-100 px-2 pt-2 pb-0 gap-0.5 scrollbar-none">
                    {EMOJI_GROUPS.map((g, i) => (
                      <button
                        key={i}
                        onClick={() => setEmojiTab(i)}
                        title={g.label}
                        className={[
                          "shrink-0 rounded-t-lg px-2 py-1.5 text-base transition-colors",
                          emojiTab === i
                            ? "border-b-2 border-blue-600 bg-blue-50"
                            : "text-slate-500 hover:bg-slate-100",
                        ].join(" ")}
                      >
                        {g.emojis[0]}
                      </button>
                    ))}
                  </div>
                  {/* Category label */}
                  <p className="shrink-0 px-3 py-1 text-[11px] font-semibold text-slate-400">
                    {EMOJI_GROUPS[emojiTab].label}
                  </p>
                  {/* Scrollable grid */}
                  <div className="flex-1 overflow-y-auto px-2 pb-2">
                    <div className="grid grid-cols-8 gap-0.5">
                      {EMOJI_GROUPS[emojiTab].emojis.map((emoji, idx) => (
                        <button
                          key={idx}
                          onClick={() => insertEmoji(emoji)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-xl transition-colors hover:bg-slate-100"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={["flex flex-1 items-end rounded-2xl border px-4 py-2.5 transition-colors", isNote ? "border-amber-300 bg-white focus-within:border-amber-400" : "border-slate-200 bg-white focus-within:border-blue-400"].join(" ")}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => { setText(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
            onKeyDown={handleKey}
            placeholder={isNote ? "Escribe una nota interna... (Enter para guardar)" : "Escribe un mensaje..."}
            className="w-full resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            style={{ minHeight: "22px", maxHeight: "120px" }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!canSend}
          className={["flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm transition-all disabled:opacity-40", isNote ? "bg-amber-400 text-white hover:bg-amber-500" : "bg-blue-600 text-white hover:bg-blue-700"].join(" ")}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-slate-50 text-slate-400">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200">
        <MessageSquare size={36} className="opacity-50" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-slate-600">Selecciona un chat</p>
        <p className="mt-1 text-sm">Elige una conversación del panel izquierdo para comenzar</p>
      </div>
    </div>
  );
}

/* ─── Inline name editor (triggered from menu) ───────── */
function InlineNameEdit({ current, onSave, onCancel }: {
  current: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(current);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 shadow-sm">
      <Edit3 size={14} className="shrink-0 text-blue-500" />
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter")  { if (val.trim()) onSave(val.trim()); }
          if (e.key === "Escape") onCancel();
        }}
        className="flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
        placeholder="Nombre del contacto"
      />
      <button onClick={() => val.trim() && onSave(val.trim())} className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700">
        <Check size={12} />
      </button>
      <button onClick={onCancel} className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100">
        <CheckCircle2 size={12} />
      </button>
    </div>
  );
}

/* ─── ChatView ───────────────────────────────────────── */
interface ChatViewProps {
  conv: PanelConversation | null;
  onUpdateMessages: (convId: string, msgs: PanelMessage[]) => void;
  localMessages: PanelMessage[];
}

export function ChatView({ conv, onUpdateMessages, localMessages }: ChatViewProps) {
  const [inputMode,      setInputMode]      = useState<InputMode>("whatsapp");
  const [contactOpen,    setContactOpen]    = useState(false);
  const [editingName,    setEditingName]    = useState(false);
  const [clientName,     setClientName]     = useState(conv?.clientName ?? "");
  const [labelsOpen,     setLabelsOpen]     = useState(false);
  const [allLabels,      setAllLabels]      = useState<Label[]>(DEFAULT_LABELS);
  const [assignedByConv, setAssignedByConv] = useState<Record<string, string[]>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  const assignedIds    = conv ? (assignedByConv[conv.id] ?? []) : [];
  const assignedLabels = allLabels.filter((l) => assignedIds.includes(l.id));

  const handleChangeAssigned = (ids: string[]) => {
    if (!conv) return;
    setAssignedByConv((prev) => ({ ...prev, [conv.id]: ids }));
  };

  /* Sync name when conversation changes */
  useEffect(() => {
    setClientName(conv?.clientName ?? "");
    setContactOpen(false);
    setEditingName(false);
  }, [conv?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  if (!conv) return <EmptyState />;

  const handleSend = (text: string, mode: InputMode, attachment?: PanelAttachment) => {
    const newMsg: PanelMessage = {
      id:             `msg-${Date.now()}`,
      type:           mode === "note" ? "internal_note" : "whatsapp_out",
      text,
      time:           new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }),
      status:         mode === "whatsapp" ? "sent" : undefined,
      authorName:     mode === "note" ? CURRENT_AGENT.name     : undefined,
      authorInitials: mode === "note" ? CURRENT_AGENT.initials : undefined,
      attachment,
    };
    onUpdateMessages(conv.id, [...localMessages, newMsg]);
  };

  const handleEditMsg = (id: string, text: string) => {
    onUpdateMessages(conv.id, localMessages.map((m) => m.id === id ? { ...m, text } : m));
  };

  const handleDeleteMsg = (id: string) => {
    onUpdateMessages(conv.id, localMessages.filter((m) => m.id !== id));
  };

  const handleUpdateName = (name: string) => {
    setClientName(name);
    setEditingName(false);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Main chat column ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div className="relative shrink-0">
            <div className={["flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white", conv.avatarColor].join(" ")}>
              {conv.clientInitials}
            </div>
            {conv.clientOnline && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {editingName ? (
              <InlineNameEdit
                current={clientName}
                onSave={handleUpdateName}
                onCancel={() => setEditingName(false)}
              />
            ) : (
              <>
                <p className="truncate text-sm font-bold text-slate-800">{clientName}</p>
                <p className="truncate text-xs text-slate-500">
                  {conv.clientPhone} · {conv.clientOnline
                    ? <span className="text-emerald-600">en línea</span>
                    : "desconectado"}
                </p>
                {assignedLabels.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {assignedLabels.map((label) => (
                      <span
                        key={label.id}
                        className={["rounded-full px-2 py-0.5 text-[10px] font-semibold", label.color, label.textColor].join(" ")}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-1">
            <button className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100">
              <Search size={18} />
            </button>

            {/* ── Three dots menu ── */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100">
                  <MoreVertical size={18} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={6}
                  className="z-50 min-w-[210px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
                >
                  <DropdownMenu.Item
                    onSelect={() => setContactOpen((v) => !v)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-100"
                  >
                    <UserIcon size={15} className="text-blue-500" />
                    {contactOpen ? "Ocultar ficha" : "Ver ficha de contacto"}
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    onSelect={() => { setContactOpen(false); setEditingName(true); }}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-100"
                  >
                    <Edit3 size={15} className="text-slate-400" />
                    Editar nombre del contacto
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    onSelect={() => setContactOpen(true)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-100"
                  >
                    <UserPlus size={15} className="text-emerald-500" />
                    Agregar a contactos
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    onSelect={() => setLabelsOpen(true)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-100"
                  >
                    <Tag size={15} className="text-violet-500" />
                    Etiquetas
                    {assignedIds.length > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-100 px-1.5 text-[10px] font-bold text-violet-700">
                        {assignedIds.length}
                      </span>
                    )}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-slate-50 py-4">
          <div className="mb-3 flex justify-center">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-0.5 text-[11px] text-slate-500 shadow-sm">
              Hoy · Asignado desde {conv.assignedSince}
            </span>
          </div>
          <div className="space-y-1">
            {localMessages.map((msg) => (
              <Bubble
                key={msg.id}
                msg={msg}
                conv={{ ...conv, clientName }}
                onEdit={handleEditMsg}
                onDelete={handleDeleteMsg}
              />
            ))}
          </div>
          <div ref={bottomRef} />
        </div>

        {/* Hybrid bar */}
        <HybridBar mode={inputMode} onModeChange={setInputMode} onSend={handleSend} />
      </div>

      {/* ── Contact panel (right) ── */}
      {contactOpen && (
        <ContactPanel
          conv={{ ...conv, clientName }}
          onClose={() => setContactOpen(false)}
          onUpdateName={handleUpdateName}
        />
      )}

      {/* ── Labels modal ── */}
      <LabelsModal
        open={labelsOpen}
        onOpenChange={setLabelsOpen}
        assignedIds={assignedIds}
        onChangeAssigned={handleChangeAssigned}
        allLabels={allLabels}
        onChangeLabels={setAllLabels}
      />
    </div>
  );
}
