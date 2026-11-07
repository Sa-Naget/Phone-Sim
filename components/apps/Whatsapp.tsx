"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion, PanInfo, useDragControls } from "framer-motion";
import { usePhoneStore } from "../../store/usePhoneStore";
import { cn } from "@/lib/utils";
import StatusBar from "../phone/StatusBar";

// ---- Data model --------------------------------------------------------

type DeliveryStatus = "sent" | "delivered" | "read";

interface WAMember {
  id: string;
  name: string;
  color: string; // color of the sender name shown above incoming group messages
}

interface WAMessage {
  id: string;
  senderId: string; // a WAMember id, or "me" for the phone owner
  text: string;
  time: string; // display clock time, e.g. "9:41 AM"
  day: string; // "Today" / "Yesterday" etc, drives the date chips and list timestamps
  status?: DeliveryStatus; // only meaningful for outgoing messages
}

interface WAReply {
  senderId: string;
  text: string;
}

interface WAThread {
  id: string;
  name: string;
  avatarUrl: string;
  isGroup: boolean;
  subtitle?: string; // overrides the member-names subtitle (used for 1:1 chats)
  members: WAMember[];
  messages: WAMessage[];
  unread: number;
  replies?: WAReply[]; // canned replies, consumed one per message the reader sends
}

const ME = "me";

const WA_GREEN = "#1fa855";
const WA_DARK_GREEN = "#0f8a4a";
const WA_BLUE = "#007aff";

// ---- Mock data: swap these threads for your narrative content -------------

const avatar = (id: string) =>
  `https://images.unsplash.com/${id}?w=160&h=160&fit=crop&crop=faces&auto=format&q=80`;

const WHATSAPP_MOCKS: WAThread[] = [
  {
    id: "group-dageng",
    name: "Bagi Bagi Dageng 😹✌🏻",
    avatarUrl:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=160&h=160&fit=crop&auto=format&q=80",
    isGroup: true,
    unread: 3,
    members: [
      { id: "agetta", name: "Agetta", color: "#a55ccf" },
      { id: "utami", name: "Utami", color: "#1f7aec" },
      { id: "nora", name: "Nora", color: "#e542a3" },
      { id: "mika", name: "Mika", color: "#d98a00" },
    ],
    messages: [
      { id: "d1", senderId: "utami", text: "ok so who's bringing the speaker tomorrow", time: "9:14 PM", day: "Yesterday" },
      { id: "d2", senderId: "agetta", text: "not me, mine's dead", time: "9:15 PM", day: "Yesterday" },
      { id: "d3", senderId: "nora", text: "i have the small one but it's so quiet 😭", time: "9:15 PM", day: "Yesterday" },
      { id: "d4", senderId: ME, text: "i'll bring mine", time: "9:17 PM", day: "Yesterday", status: "read" },
      { id: "d5", senderId: "utami", text: "ur a lifesaver", time: "9:17 PM", day: "Yesterday" },
      { id: "d6", senderId: "mika", text: "wait are we still meeting at 9??", time: "9:40 PM", day: "Yesterday" },
      { id: "d7", senderId: "agetta", text: "yes. 9. sharp. Mika don't be late again", time: "9:41 PM", day: "Yesterday" },
      { id: "d8", senderId: "mika", text: "ONE time", time: "9:41 PM", day: "Yesterday" },
      { id: "d9", senderId: "utami", text: "did anyone see Agetta's post last night", time: "8:52 AM", day: "Today" },
      { id: "d10", senderId: "nora", text: "the \"unsent\" one? yeah...", time: "8:53 AM", day: "Today" },
      { id: "d11", senderId: "mika", text: "he never posts stuff like that", time: "8:53 AM", day: "Today" },
      { id: "d12", senderId: ME, text: "i'll ask him when he gets here, don't make it weird", time: "8:55 AM", day: "Today", status: "read" },
      { id: "d13", senderId: "utami", text: "us? weird? never 😇", time: "8:56 AM", day: "Today" },
      { id: "d14", senderId: "agetta", text: "i can see this chat, btw", time: "8:58 AM", day: "Today" },
    ],
    replies: [
      { senderId: "utami", text: "LMAOOO he's right here" },
      { senderId: "nora", text: "ok everyone act normal" },
      { senderId: "agetta", text: "9. sharp. don't forget the speaker" },
    ],
  },
  {
    id: "dm-agetta",
    name: "Mas Agettaaaaaa",
    avatarUrl: avatar("photo-1500648767791-00dcc994a43e"),
    isGroup: false,
    subtitle: "online",
    unread: 1,
    members: [{ id: "agetta", name: "Agetta", color: "#a55ccf" }],
    messages: [
      { id: "a1", senderId: "agetta", text: "did you get home okay?", time: "9:38 AM", day: "Today" },
      { id: "a2", senderId: ME, text: "yap yap, just got hereee", time: "9:40 AM", day: "Today", status: "read" },
      { id: "a3", senderId: "agetta", text: "good. text me tomorrow", time: "9:41 AM", day: "Today" },
    ],
    replies: [{ senderId: "agetta", text: "haha stop texting me so late" }],
  },
  {
    id: "dm-mama",
    name: "Mama",
    avatarUrl: avatar("photo-1544005313-94ddf0286df2"),
    isGroup: false,
    subtitle: "last seen today at 7:20 AM",
    unread: 0,
    members: [{ id: "mama", name: "Mama", color: "#1c9d7a" }],
    messages: [
      { id: "m1", senderId: "mama", text: "Sudah makan belum?", time: "6:30 PM", day: "Yesterday" },
      { id: "m2", senderId: ME, text: "udah ma 🍚", time: "6:41 PM", day: "Yesterday", status: "read" },
      { id: "m3", senderId: "mama", text: "Hati-hati ya besok", time: "6:42 PM", day: "Yesterday" },
    ],
    replies: [{ senderId: "mama", text: "Jangan lupa istirahat ya 🤍" }],
  },
  {
    id: "group-study",
    name: "Study Group XII",
    avatarUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=160&h=160&fit=crop&auto=format&q=80",
    isGroup: true,
    unread: 3,
    members: [
      { id: "raka", name: "Raka", color: "#1f7aec" },
      { id: "dewi", name: "Dewi", color: "#e542a3" },
      { id: "bima", name: "Bima", color: "#d98a00" },
    ],
    messages: [
      { id: "s1", senderId: "raka", text: "pr matematika udah ada yang kerjain?", time: "7:02 AM", day: "Today" },
      { id: "s2", senderId: "dewi", text: "belum 😭 nomor 5 susah banget", time: "7:04 AM", day: "Today" },
      { id: "s3", senderId: "bima", text: "nanti kerjain bareng di kelas aja", time: "7:05 AM", day: "Today" },
    ],
    replies: [{ senderId: "raka", text: "oke, jam istirahat ya" }],
  },
];

// ---- Shared constants and helpers ------------------------------------------

const NO_SCROLLBAR_CLASS = "[&::-webkit-scrollbar]:hidden";
const NO_SCROLLBAR_STYLE: CSSProperties = {
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

// Subtle doodle pattern for the chat wallpaper, built as an inline SVG tile
const WALLPAPER_TILE = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g fill='none' stroke='#6b5d4a' stroke-opacity='0.1' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'><circle cx='24' cy='24' r='8'/><path d='M92 18v14M85 25h14'/><path d='M130 52l-9-9a5.5 5.5 0 018-8l1 1 1-1a5.5 5.5 0 018 8z'/><rect x='20' y='84' width='34' height='22' rx='9'/><path d='M30 106l-4 8 12-8'/><path d='M96 96l3.5 7.5 8 1-6 5.5 1.7 8-7.2-4.2-7.2 4.2 1.7-8-6-5.5 8-1z'/><path d='M132 100a12 12 0 1010 18 10 10 0 01-10-18z'/><path d='M60 144q6-8 12 0t12 0'/></g></svg>`;

const WALLPAPER_STYLE: CSSProperties = {
  backgroundColor: "#efeae2",
  backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(WALLPAPER_TILE)}")`,
  backgroundSize: "160px 160px",
};

const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const firstName = (name: string) => name.split(" ")[0];

function getPreview(thread: WAThread) {
  const last = thread.messages[thread.messages.length - 1];
  if (!last) {
    return { text: "", time: "", outgoing: false, status: undefined as DeliveryStatus | undefined };
  }
  const outgoing = last.senderId === ME;
  const sender = thread.members.find((m) => m.id === last.senderId);
  const prefix = !outgoing && thread.isGroup && sender ? `${firstName(sender.name)}: ` : "";
  return {
    text: `${prefix}${last.text}`,
    time: last.day === "Today" ? last.time : last.day,
    outgoing,
    status: last.status,
  };
}

// ---- Icons (inline SVG) ------------------------------------------------------

function ChevronLeftIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 4.5L7.5 12 15 19.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CameraIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 8.5A2.5 2.5 0 015.5 6h2.2l1.2-1.8A1.5 1.5 0 0110.150 3.500h3.700a1.500 1.500 0 011.250.7L16.300 6h2.200A2.500 2.500 0 0121 8.500v9a2.500 2.500 0 01-2.500 2.500h-13A2.500 2.500 0 013 17.500v-9z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function NewChatIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <circle cx="15" cy="15" r="15" fill={WA_GREEN} />
      <path d="M15 8.500v13M8.500 15h13" stroke="white" strokeWidth="2.400" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7.500" stroke="currentColor" strokeWidth="2.200" />
      <path d="M20.500 20.500l-4.200-4.200" stroke="currentColor" strokeWidth="2.200" strokeLinecap="round" />
    </svg>
  );
}

function VideoIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.500" y="6" width="13" height="12" rx="3" stroke="currentColor" strokeWidth="1.800" />
      <path d="M15.500 10.500l5.200-3v9l-5.200-3" stroke="currentColor" strokeWidth="1.800" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon({ size = 24, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden="true">
      <path
        d="M22 16.920v3a2 2 0 01-2.180 2 19.790 19.790 0 01-8.630-3.070 19.500 19.500 0 01-6-6 19.790 19.790 0 01-3.070-8.670A2 2 0 014.110 2h3a2 2 0 012 1.720 12.840 12.840 0 00.700 2.810 2 2 0 01-.450 2.110L8.090 9.910a16 16 0 006 6l1.270-1.270a2 2 0 012.110-.450 12.840 12.840 0 002.810.700A2 2 0 0122 16.920z"
        stroke="currentColor"
        strokeWidth="1.800"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4.500v15M4.500 12h15" stroke="currentColor" strokeWidth="2.200" strokeLinecap="round" />
    </svg>
  );
}

function MicIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="2.500" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.800" />
      <path d="M5 11.500a7 7 0 0014 0M12 18.500v3" stroke="currentColor" strokeWidth="1.800" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M3.400 20.400l17.450-7.480a1 1 0 000-1.840L3.400 3.600a.993.993 0 00-1.390.910L2 9.120c0 .500.370.930.870.990L17 12 2.870 13.880c-.500.070-.870.500-.870 1l.010 4.610c0 .710.730 1.200 1.390.910z" />
    </svg>
  );
}

function CheckIcon({ double, color }: { double: boolean; color: string }) {
  return (
    <svg width={double ? 17 : 12} height="11" viewBox={double ? "0 0 17 11" : "0 0 12 11"} fill="none" aria-hidden="true">
      <path d="M1 5.800l3.300 3.300L10.500 1.800" stroke={color} strokeWidth="1.500" strokeLinecap="round" strokeLinejoin="round" />
      {double && (
        <path d="M6.600 8.300l.800.800L15.500 1.800" stroke={color} strokeWidth="1.500" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function LockIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.500" y="10.500" width="15" height="10.500" rx="2.500" fill="currentColor" />
      <path d="M8 10.500V7.500a4 4 0 018 0v3" stroke="currentColor" strokeWidth="2.200" strokeLinecap="round" />
    </svg>
  );
}

function UpdatesTabIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.500" stroke="currentColor" strokeWidth="1.800" strokeDasharray="3.600 2.400" />
      <circle cx="12" cy="12" r="4.200" fill="currentColor" />
    </svg>
  );
}

function CommunitiesTabIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.200" stroke="currentColor" strokeWidth="1.800" />
      <path d="M6.200 20v-1.200a5.800 5.800 0 0111.600 0V20" stroke="currentColor" strokeWidth="1.800" strokeLinecap="round" />
      <circle cx="4.800" cy="9.500" r="2.100" stroke="currentColor" strokeWidth="1.800" />
      <path d="M1.600 17.200a3.800 3.800 0 013.400-3.700" stroke="currentColor" strokeWidth="1.800" strokeLinecap="round" />
      <circle cx="19.200" cy="9.500" r="2.100" stroke="currentColor" strokeWidth="1.800" />
      <path d="M22.400 17.200a3.800 3.800 0 00-3.400-3.700" stroke="currentColor" strokeWidth="1.800" strokeLinecap="round" />
    </svg>
  );
}

function ChatsTabIcon({ size = 26, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 11.500a8.500 8.500 0 01-12.400 7.550L3 21l1.950-5.600A8.500 8.500 0 1121 11.500z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.800"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsTabIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.800" />
      <path
        d="M19.400 15a1.650 1.650 0 00.330 1.820l.060.060a2 2 0 010 2.830 2 2 0 01-2.830 0l-.060-.060a1.650 1.650 0 00-1.820-.330 1.650 1.650 0 00-1 1.510V21a2 2 0 01-2 2 2 2 0 01-2-2v-.090A1.650 1.650 0 009 19.400a1.650 1.650 0 00-1.820.330l-.060.060a2 2 0 01-2.830 0 2 2 0 010-2.830l.060-.060a1.650 1.650 0 00.330-1.820 1.650 1.650 0 00-1.510-1H3a2 2 0 01-2-2 2 2 0 012-2h.090A1.650 1.650 0 004.600 9a1.650 1.650 0 00-.330-1.820l-.060-.060a2 2 0 010-2.830 2 2 0 012.830 0l.060.060a1.650 1.650 0 001.820.330H9a1.650 1.650 0 001-1.510V3a2 2 0 012-2 2 2 0 012 2v.090a1.650 1.650 0 001 1.510 1.650 1.650 0 001.820-.330l.060-.060a2 2 0 012.830 0 2 2 0 010 2.830l-.060.060a1.650 1.650 0 00-.330 1.820V9a1.650 1.650 0 001.510 1H21a2 2 0 012 2 2 2 0 01-2 2h-.090a1.650 1.650 0 00-1.510 1z"
        stroke="currentColor"
        strokeWidth="1.600"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---- iOS keyboard ----------------------------------------------------------

const ROW_1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
const ROW_2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
const ROW_3 = ["z", "x", "c", "v", "b", "n", "m"];
const NUM_ROW_1 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const NUM_ROW_2 = ["-", "/", ":", ";", "(", ")", "$", "&", "@", '"'];
const NUM_ROW_3 = [".", ",", "?", "!", "'"];

function KeyButton({
  label,
  onClick,
  wide = false,
  active = false,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly wide?: boolean;
  readonly active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-[42px] rounded-[6px] shadow text-[18px] font-normal select-none active:bg-neutral-300 transition-colors duration-100 flex items-center justify-center cursor-pointer",
        active ? "bg-white/70 text-[#007aff]" : "bg-white text-black",
        wide ? "w-[42px] text-[14px]" : "flex-1"
      )}
    >
      {label}
    </button>
  );
}

function Keyboard({
  onKey,
  onBackspace,
  onSend,
}: {
  readonly onKey: (char: string) => void;
  readonly onBackspace: () => void;
  readonly onSend: () => void;
}) {
  const [layer, setLayer] = useState<"letters" | "numbers">("letters");
  const [shiftOn, setShiftOn] = useState(false);

  const typeLetter = (letter: string) => {
    onKey(shiftOn ? letter.toUpperCase() : letter);
    if (shiftOn) setShiftOn(false);
  };

  const bottomRow = (layerLabel: string, onLayerToggle: () => void) => (
    <div className="flex gap-[6px] px-1">
      <KeyButton label={layerLabel} wide onClick={onLayerToggle} />
      <button
        onClick={() => onKey(" ")}
        aria-label="Space"
        className="flex-1 h-[42px] rounded-[6px] bg-white shadow select-none active:bg-neutral-300 transition-colors duration-100 cursor-pointer"
      />
      <button
        onClick={onSend}
        className="w-[76px] h-[42px] rounded-[6px] bg-white shadow text-[15px] font-medium select-none active:bg-neutral-300 transition-colors duration-100 cursor-pointer"
      >
        return
      </button>
    </div>
  );

  return (
    <motion.div
      key="keyboard"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 252, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 38 }}
      className="overflow-hidden bg-[#d1d4da] border-t border-black/10"
    >
      <div className="h-[252px] px-1.5 pt-2 pb-6 flex flex-col gap-[6px]">
        {layer === "letters" ? (
          <>
            <div className="flex justify-center gap-[6px]">
              {ROW_1.map((k) => (
                <KeyButton key={k} label={shiftOn ? k.toUpperCase() : k} onClick={() => typeLetter(k)} />
              ))}
            </div>
            <div className="flex justify-center gap-[6px] px-4">
              {ROW_2.map((k) => (
                <KeyButton key={k} label={shiftOn ? k.toUpperCase() : k} onClick={() => typeLetter(k)} />
              ))}
            </div>
            <div className="flex justify-center gap-[6px]">
              <KeyButton label="⇧" wide active={shiftOn} onClick={() => setShiftOn((v) => !v)} />
              {ROW_3.map((k) => (
                <KeyButton key={k} label={shiftOn ? k.toUpperCase() : k} onClick={() => typeLetter(k)} />
              ))}
              <KeyButton label="⌫" wide onClick={onBackspace} />
            </div>
            {bottomRow("123", () => setLayer("numbers"))}
          </>
        ) : (
          <>
            <div className="flex justify-center gap-[6px]">
              {NUM_ROW_1.map((k) => (
                <KeyButton key={k} label={k} onClick={() => onKey(k)} />
              ))}
            </div>
            <div className="flex justify-center gap-[6px]">
              {NUM_ROW_2.map((k) => (
                <KeyButton key={k} label={k} onClick={() => onKey(k)} />
              ))}
            </div>
            <div className="flex justify-center gap-[6px] px-6">
              {NUM_ROW_3.map((k) => (
                <KeyButton key={k} label={k} onClick={() => onKey(k)} />
              ))}
              <KeyButton label="⌫" wide onClick={onBackspace} />
            </div>
            {bottomRow("ABC", () => setLayer("letters"))}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ---- Chat list screen ------------------------------------------------------

type ListFilter = "all" | "unread" | "groups";

const FILTERS: { id: ListFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "groups", label: "Groups" },
];

function TabBar({ totalUnread }: { readonly totalUnread: number }) {
  const tab =
    "relative flex-1 flex flex-col items-center gap-0.5 pt-2 active:scale-95 transition-all duration-100 cursor-pointer";

  return (
    <nav className="flex items-start px-1 pb-6 border-t border-black/10 bg-white/95 backdrop-blur-xl">
      <button className={cn(tab, "text-neutral-500")} aria-label="Updates">
        <UpdatesTabIcon />
        <span className="text-[10px] font-medium">Updates</span>
      </button>
      <button className={cn(tab, "text-neutral-500")} aria-label="Calls">
        <PhoneIcon size={26} />
        <span className="text-[10px] font-medium">Calls</span>
      </button>
      <button className={cn(tab, "text-neutral-500")} aria-label="Communities">
        <CommunitiesTabIcon />
        <span className="text-[10px] font-medium">Communities</span>
      </button>
      <button className={cn(tab)} style={{ color: WA_DARK_GREEN }} aria-label="Chats" aria-current="page">
        <span className="relative">
          <ChatsTabIcon active />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#ff3b30] text-white text-[10.5px] font-semibold flex items-center justify-center">
              {totalUnread}
            </span>
          )}
        </span>
        <span className="text-[10px] font-semibold">Chats</span>
      </button>
      <button className={cn(tab, "text-neutral-500")} aria-label="Settings">
        <SettingsTabIcon />
        <span className="text-[10px] font-medium">Settings</span>
      </button>
    </nav>
  );
}

function ChatListScreen({
  threads,
  typing,
  onOpen,
  onClose,
}: {
  readonly threads: WAThread[];
  readonly typing: { threadId: string; name: string } | null;
  readonly onOpen: (id: string) => void;
  readonly onClose: () => void;
}) {
  const [filter, setFilter] = useState<ListFilter>("all");
  const dragControls = useDragControls();

  const visible = threads.filter((t) => {
    if (filter === "unread") return t.unread > 0;
    if (filter === "groups") return t.isGroup;
    return true;
  });
  const totalUnread = threads.reduce((sum, t) => sum + t.unread, 0);

  // Swipe-down-to-close is bound to the header only, so it never fights the
  // list's own vertical scrolling.
  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  const headerButton = "active:scale-95 transition-all duration-100 cursor-pointer";

  return (
    <motion.div
      key="wa-list"
      drag="y"
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.12}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 z-10 bg-white flex flex-col"
    >
      <StatusBar dark />

      <div
        onPointerDown={(e) => dragControls.start(e)}
        style={{ touchAction: "none" }}
        className="pt-12 px-4 pb-1 bg-white"
      >
        <div className="flex items-center justify-between h-10">
          <button className={cn(headerButton, "text-[17px]")} style={{ color: WA_BLUE }}>
            Edit
          </button>
          <div className="flex items-center gap-4">
            <button aria-label="Camera" className={cn(headerButton, "text-[#262626]")}>
              <CameraIcon />
            </button>
            <button aria-label="New chat" className={headerButton}>
              <NewChatIcon />
            </button>
          </div>
        </div>
        <h1 className="text-[32px] font-bold tracking-tight text-black leading-tight mt-1">Chats</h1>
      </div>

      <div
        className={cn("flex-1 overflow-y-auto", NO_SCROLLBAR_CLASS)}
        style={NO_SCROLLBAR_STYLE}
      >
        <div className="px-4 pt-1 pb-2">
          <div className="flex items-center gap-1.5 bg-[#efeff0] rounded-[10px] px-3 h-9 text-neutral-500">
            <SearchIcon />
            <span className="text-[16px]">Search</span>
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-3.5 h-8 rounded-full text-[14px] font-medium active:scale-95 transition-all duration-100 cursor-pointer",
                filter === f.id ? "bg-[#d9fdd3]" : "bg-[#efeff0] text-neutral-600"
              )}
              style={filter === f.id ? { color: WA_DARK_GREEN } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="px-8 py-16 text-center text-[15px] text-neutral-500">
            No chats match this filter.
          </div>
        )}

        {visible.map((t) => {
          const preview = getPreview(t);
          const isTyping = typing?.threadId === t.id;
          const hasUnread = t.unread > 0;

          return (
            <button
              key={t.id}
              onClick={() => onOpen(t.id)}
              className="w-full flex items-center gap-3 pl-4 active:bg-neutral-100 transition-colors duration-100 text-left cursor-pointer"
            >
              <img
                src={t.avatarUrl}
                alt={t.name}
                className="w-[52px] h-[52px] rounded-full object-cover bg-neutral-200 shrink-0"
              />
              <div className="flex-1 min-w-0 py-3 pr-4 border-b border-black/5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[16.5px] font-semibold text-black truncate">{t.name}</span>
                  <span
                    className={cn("text-[13px] shrink-0", hasUnread ? "font-medium" : "text-neutral-500")}
                    style={hasUnread ? { color: WA_DARK_GREEN } : undefined}
                  >
                    {preview.time}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <div className="flex items-center gap-1 min-w-0">
                    {!isTyping && preview.outgoing && (
                      <span className="shrink-0">
                        <CheckIcon
                          double={preview.status !== "sent"}
                          color={preview.status === "read" ? "#34b7f1" : "#8696a0"}
                        />
                      </span>
                    )}
                    {isTyping ? (
                      <span className="text-[14.5px] truncate" style={{ color: WA_DARK_GREEN }}>
                        {t.isGroup ? `${typing?.name} is typing…` : "typing…"}
                      </span>
                    ) : (
                      <span className="text-[14.5px] text-neutral-500 truncate">{preview.text}</span>
                    )}
                  </div>
                  {hasUnread && (
                    <span
                      className="shrink-0 min-w-[21px] h-[21px] px-1.5 rounded-full text-white text-[12.5px] font-semibold flex items-center justify-center"
                      style={{ backgroundColor: WA_DARK_GREEN }}
                    >
                      {t.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <TabBar totalUnread={totalUnread} />
    </motion.div>
  );
}

// ---- Chat room -------------------------------------------------------------

function DayChip({ label }: { readonly label: string }) {
  return (
    <div className="flex justify-center my-2.5">
      <span className="px-3 py-1 rounded-lg bg-white/90 shadow-sm text-[11.5px] font-medium text-neutral-500 tracking-wide uppercase">
        {label}
      </span>
    </div>
  );
}

function MessageBubble({
  message,
  isOutgoing,
  isFirstInRun,
  senderName,
  senderColor,
}: {
  readonly message: WAMessage;
  readonly isOutgoing: boolean;
  readonly isFirstInRun: boolean;
  readonly senderName?: string;
  readonly senderColor?: string;
}) {
  const status = message.status ?? "sent";

  return (
    <div className={cn("flex", isOutgoing ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[80%] px-2.5 pt-1.5 pb-1.5 rounded-[10px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]",
          isOutgoing ? "bg-[#d9fdd3]" : "bg-white",
          isFirstInRun && (isOutgoing ? "rounded-tr-[3px]" : "rounded-tl-[3px]")
        )}
      >
        {senderName && (
          <div className="text-[13px] font-semibold leading-tight mb-0.5" style={{ color: senderColor }}>
            {senderName}
          </div>
        )}
        <span className="text-[15.5px] leading-[20px] text-black whitespace-pre-wrap break-words">
          {message.text}
        </span>
        {/* Invisible spacer reserves room so the absolute time never overlaps the text */}
        <span
          className={cn("inline-block h-px", isOutgoing ? "w-[80px]" : "w-[58px]")}
          aria-hidden="true"
        />
        <span className="absolute bottom-1 right-2 flex items-center gap-1 text-[11px] leading-none text-neutral-500">
          {message.time}
          {isOutgoing && (
            <CheckIcon
              double={status !== "sent"}
              color={status === "read" ? "#34b7f1" : "#8696a0"}
            />
          )}
        </span>
      </div>
    </div>
  );
}

function ChatRoomScreen({
  thread,
  typingName,
  draft,
  setDraft,
  onSend,
  onBack,
  keyboardOpen,
  setKeyboardOpen,
}: {
  readonly thread: WAThread;
  readonly typingName: string | null;
  readonly draft: string;
  readonly setDraft: (value: string) => void;
  readonly onSend: () => void;
  readonly onBack: () => void;
  readonly keyboardOpen: boolean;
  readonly setKeyboardOpen: (open: boolean) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view when messages arrive, the keyboard
  // resizes the timeline, or the typing state changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.messages.length, keyboardOpen, typingName]);

  const memberNames = thread.members.map((m) => firstName(m.name)).join(", ");
  const defaultSubtitle = thread.isGroup ? `${memberNames}, You` : "online";
  let subtitle = thread.subtitle ?? defaultSubtitle;
  if (typingName) subtitle = thread.isGroup ? `${typingName} is typing…` : "typing…";

  const headerButton =
    "text-[#262626] active:scale-95 transition-all duration-100 cursor-pointer";

  return (
    <motion.div
      key="wa-chat"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.08}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100 || info.velocity.x > 600) onBack();
      }}
      initial={{ x: "100%" }}
      animate={{ x: 0, transition: { type: "spring", stiffness: 380, damping: 38 } }}
      exit={{ x: "100%", transition: { duration: 0.26 } }}
      className="absolute inset-0 z-20 bg-white flex flex-col"
    >
      <StatusBar dark />

      {/* Header */}
      <div className="flex items-center gap-1 pt-12 pb-2 pl-1 pr-3 bg-white border-b border-black/10">
        <button
          onClick={onBack}
          aria-label="Back to chats"
          className="p-1 active:scale-95 transition-all duration-100 cursor-pointer"
          style={{ color: WA_BLUE }}
        >
          <ChevronLeftIcon />
        </button>

        <button className="flex items-center gap-2.5 flex-1 min-w-0 text-left active:opacity-70 transition-opacity duration-100 cursor-pointer">
          <img
            src={thread.avatarUrl}
            alt={thread.name}
            className="w-9 h-9 rounded-full object-cover bg-neutral-200 shrink-0"
          />
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="text-[16.5px] font-semibold text-black truncate">{thread.name}</span>
            <span
              className={cn("text-[12px] truncate", !typingName && "text-neutral-500")}
              style={typingName ? { color: WA_DARK_GREEN } : undefined}
            >
              {subtitle}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-4 pl-2">
          <button aria-label="Video call" className={headerButton}>
            <VideoIcon />
          </button>
          <button aria-label="Voice call" className={headerButton}>
            <PhoneIcon size={23} />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div
        ref={scrollRef}
        onClick={() => keyboardOpen && setKeyboardOpen(false)}
        className={cn("flex-1 min-h-0 overflow-y-auto px-3 py-2", NO_SCROLLBAR_CLASS)}
        style={{ ...WALLPAPER_STYLE, ...NO_SCROLLBAR_STYLE }}
      >
        <div className="flex justify-center mb-2">
          <span className="flex items-center gap-1.5 max-w-[88%] px-3 py-1.5 rounded-lg bg-[#fff5c4] text-[11.5px] leading-snug text-[#54656f] text-center shadow-sm">
            <LockIcon />
            Messages and calls are end-to-end encrypted. Only people in this chat can read them.
          </span>
        </div>

        {thread.messages.map((m, i) => {
          const prev = thread.messages[i - 1];
          const showDivider = !prev || prev.day !== m.day;
          const isOutgoing = m.senderId === ME;
          const isFirstInRun = showDivider || !prev || prev.senderId !== m.senderId;
          const member = thread.members.find((x) => x.id === m.senderId);
          const showSender = thread.isGroup && !isOutgoing && isFirstInRun;

          return (
            <div key={m.id}>
              {showDivider && <DayChip label={m.day} />}
              <div className={isFirstInRun && !showDivider ? "mt-2" : "mt-[3px]"}>
                <MessageBubble
                  message={m}
                  isOutgoing={isOutgoing}
                  isFirstInRun={isFirstInRun}
                  senderName={showSender ? member?.name : undefined}
                  senderColor={member?.color}
                />
              </div>
            </div>
          );
        })}
        <div className="h-1" />
      </div>

      {/* Input strip */}
      <div
        className={cn(
          "flex items-end gap-1.5 px-2 pt-2 bg-white border-t border-black/10",
          keyboardOpen ? "pb-2" : "pb-6"
        )}
      >
        <button
          aria-label="Attach"
          className="p-1.5 active:scale-95 transition-all duration-100 cursor-pointer"
          style={{ color: WA_BLUE }}
        >
          <PlusIcon />
        </button>

        <button
          onClick={() => setKeyboardOpen(true)}
          aria-label="Message"
          className="flex-1 min-h-[36px] max-h-24 overflow-hidden flex items-center rounded-[18px] border border-black/15 bg-white px-3.5 py-1.5 text-left cursor-text"
        >
          {!draft && keyboardOpen && (
            <motion.span
              className="inline-block w-[2px] h-[18px] bg-[#007aff] mr-0.5"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
          {draft ? (
            <span className="text-[16px] leading-[20px] text-black break-words">
              {draft}
              {keyboardOpen && (
                <motion.span
                  className="inline-block w-[2px] h-[18px] bg-[#007aff] align-middle ml-px"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </span>
          ) : (
            <span className="text-[16px] text-neutral-400">Message</span>
          )}
        </button>

        {draft.trim().length > 0 ? (
          <button
            onClick={onSend}
            aria-label="Send"
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-all duration-100 cursor-pointer"
            style={{ backgroundColor: WA_GREEN }}
          >
            <SendIcon />
          </button>
        ) : (
          <div className="flex items-center gap-0.5 text-[#262626]">
            <button
              aria-label="Camera"
              className="p-1.5 active:scale-95 transition-all duration-100 cursor-pointer"
            >
              <CameraIcon />
            </button>
            <button
              aria-label="Voice message"
              className="p-1.5 active:scale-95 transition-all duration-100 cursor-pointer"
            >
              <MicIcon />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {keyboardOpen && (
          <Keyboard
            onKey={(char) => setDraft(draft + char)}
            onBackspace={() => setDraft(draft.slice(0, -1))}
            onSend={onSend}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---- Root component --------------------------------------------------------

export default function WhatsAppApp() {
  const closeApp = usePhoneStore((s) => s.closeApp);

  const [threads, setThreads] = useState<WAThread[]>(WHATSAPP_MOCKS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [typing, setTyping] = useState<{ threadId: string; name: string } | null>(null);

  const activeChatRef = useRef<string | null>(null);
  const replyCursor = useRef<Record<string, number>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const schedule = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const activeThread = threads.find((t) => t.id === activeId) ?? null;

  const openThread = (id: string) => {
    activeChatRef.current = id;
    setActiveId(id);
    setKeyboardOpen(false);
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t)));
  };

  const backToList = () => {
    activeChatRef.current = null;
    setActiveId(null);
    setKeyboardOpen(false);
  };

  // Adds a message to a thread and moves that thread to the top of the list,
  // like the real app does when a conversation gets new activity.
  const appendMessage = (threadId: string, message: WAMessage, countAsUnread: boolean) => {
    setThreads((prev) => {
      const target = prev.find((t) => t.id === threadId);
      if (!target) return prev;
      const updated: WAThread = {
        ...target,
        messages: [...target.messages, message],
        unread: countAsUnread ? target.unread + 1 : target.unread,
      };
      return [updated, ...prev.filter((t) => t.id !== threadId)];
    });
  };

  const setMessageStatus = (threadId: string, messageId: string, status: DeliveryStatus) => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? { ...t, messages: t.messages.map((m) => (m.id === messageId ? { ...m, status } : m)) }
          : t
      )
    );
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text || !activeId) return;

    const threadId = activeId;
    const thread = threads.find((t) => t.id === threadId);
    const messageId = `${threadId}-${Date.now()}`;

    appendMessage(
      threadId,
      { id: messageId, senderId: ME, text, time: nowTime(), day: "Today", status: "sent" },
      false
    );
    setDraft("");

    // The single check becomes a double check, then turns blue
    schedule(() => setMessageStatus(threadId, messageId, "delivered"), 500);
    schedule(() => setMessageStatus(threadId, messageId, "read"), 1400);

    // Canned reply from the thread's `replies` list: typing indicator first,
    // then the message itself. If the reader has left the chat by then, the
    // reply counts as unread.
    const cursor = replyCursor.current[threadId] ?? 0;
    const reply = thread?.replies?.[cursor];
    if (thread && reply) {
      replyCursor.current[threadId] = cursor + 1;
      const replier = thread.members.find((m) => m.id === reply.senderId);
      const replierName = replier ? firstName(replier.name) : thread.name;

      schedule(() => setTyping({ threadId, name: replierName }), 1700);
      schedule(() => {
        setTyping(null);
        appendMessage(
          threadId,
          {
            id: `${threadId}-reply-${Date.now()}`,
            senderId: reply.senderId,
            text: reply.text,
            time: nowTime(),
            day: "Today",
          },
          activeChatRef.current !== threadId
        );
      }, 3400);
    }
  };

  return (
    <div className="absolute inset-0 bg-white overflow-hidden">
      <ChatListScreen threads={threads} typing={typing} onOpen={openThread} onClose={closeApp} />

      <AnimatePresence>
        {activeThread && (
          <ChatRoomScreen
            key={activeThread.id}
            thread={activeThread}
            typingName={typing?.threadId === activeThread.id ? typing.name : null}
            draft={draft}
            setDraft={setDraft}
            onSend={sendMessage}
            onBack={backToList}
            keyboardOpen={keyboardOpen}
            setKeyboardOpen={setKeyboardOpen}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
