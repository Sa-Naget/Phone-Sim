"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { usePhoneStore } from "../../store/usePhoneStore";
import { cn } from "@/lib/utils";
import StatusBar from "../phone/StatusBar";

// ---- Data model --------------------------------------------------------

interface Thread {
  id: string;
  name: string;
  avatar: string; // path under /public/avatars/
  online: boolean;
  unread: number;
}

interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  time: string; // display string, e.g. "9:41 AM"
  read?: boolean; // only meaningful for "me" messages
}

// --- Seed data: swap freely, or wire to your real narrative content ---
const INITIAL_THREADS: Thread[] = [
  {
    id: "aiko",
    name: "Aiko",
    avatar: "/avatars/aiko.jpg",
    online: true,
    unread: 2,
  },
  {
    id: "noah",
    name: "Noah",
    avatar: "/avatars/noah.jpg",
    online: false,
    unread: 0,
  },
  {
    id: "group-skaduta",
    name: "SKADUTA Crew",
    avatar: "/avatars/group.jpg",
    online: false,
    unread: 5,
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  aiko: [
    { id: "a1", from: "them", text: "did you get home okay?", time: "9:38 AM" },
    { id: "a2", from: "me", text: "yeah just walked in", time: "9:40 AM", read: true },
    { id: "a3", from: "them", text: "good. text me tomorrow", time: "9:41 AM" },
  ],
  noah: [
    { id: "n1", from: "them", text: "deadline moved to friday", time: "Yesterday" },
  ],
  "group-skaduta": [
    { id: "g1", from: "them", text: "meeting notes are up", time: "2:14 PM" },
    { id: "g2", from: "them", text: "check the drive folder", time: "2:15 PM" },
  ],
};

const LAST_MESSAGE_PREVIEW: Record<string, string> = {
  aiko: "good. text me tomorrow",
  noah: "deadline moved to friday",
  "group-skaduta": "check the drive folder",
};

const LAST_MESSAGE_TIME: Record<string, string> = {
  aiko: "9:41 AM",
  noah: "Yesterday",
  "group-skaduta": "2:15 PM",
};

// ---- Virtual keyboard ---------------------------------------------------

const ROW_1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
const ROW_2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
const ROW_3 = ["z", "x", "c", "v", "b", "n", "m"];

function VirtualKeyboard({
  onKey,
  onBackspace,
  onSend,
}: {
  onKey: (char: string) => void;
  onBackspace: () => void;
  onSend: () => void;
}) {
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
        <div className="flex justify-center gap-[6px]">
          {ROW_1.map((k) => (
            <KeyButton key={k} label={k} onClick={() => onKey(k)} />
          ))}
        </div>
        <div className="flex justify-center gap-[6px] px-4">
          {ROW_2.map((k) => (
            <KeyButton key={k} label={k} onClick={() => onKey(k)} />
          ))}
        </div>
        <div className="flex justify-center gap-[6px]">
          <KeyButton label="⇧" wide onClick={() => {}} />
          {ROW_3.map((k) => (
            <KeyButton key={k} label={k} onClick={() => onKey(k)} />
          ))}
          <KeyButton label="⌫" wide onClick={onBackspace} />
        </div>
        <div className="flex gap-[6px] px-1">
          <KeyButton label="123" wide onClick={() => {}} />
          <button
            onClick={() => onKey(" ")}
            className="flex-1 h-[42px] rounded-[6px] bg-white shadow select-none active:bg-gray-200"
          />
          <button
            onClick={onSend}
            className="w-[76px] h-[42px] rounded-[6px] bg-white shadow text-[15px] font-medium select-none active:bg-gray-200"
          >
            return
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function KeyButton({
  label,
  onClick,
  wide = false,
}: {
  label: string;
  onClick: () => void;
  wide?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-[42px] rounded-[6px] bg-white shadow text-[18px] font-normal lowercase select-none active:bg-gray-200 flex items-center justify-center",
        wide ? "w-[42px] text-[14px]" : "flex-1"
      )}
    >
      {label}
    </button>
  );
}

// ---- Conversations list screen -----------------------------------------

function ConversationList({
  threads,
  onOpen,
  onClose,
}: {
  threads: Thread[];
  onOpen: (id: string) => void;
  onClose: () => void;
}) {
  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  return (
    <motion.div
      key="list"
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.12}
      onDragEnd={handleDragEnd}
      initial={{ x: 0 }}
      animate={{ x: 0 }}
      exit={{ x: "-28%", opacity: 0.5, transition: { duration: 0.28 } }}
      className="absolute inset-0 z-10 bg-white flex flex-col"
    >
      <StatusBar dark />
      <div className="pt-14 px-4 pb-2">
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-[32px] font-bold tracking-tight text-black">Messages</h1>
          <button className="text-ios-blue text-[16px] font-medium">Edit</button>
        </div>

        {/* Search bar */}
        <div className="mt-2 mb-1 flex items-center gap-1.5 bg-[#e9e9eb] rounded-[10px] px-3 h-9">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="#8e8e93" strokeWidth="1.6" />
            <path d="M10.3 10.3L13 13" stroke="#8e8e93" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="text-[15px] text-ios-gray">Search</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {threads.map((t) => (
          <button
            key={t.id}
            onClick={() => onOpen(t.id)}
            className="w-full flex items-center gap-3 px-4 py-2.5 active:bg-gray-100 text-left"
          >
            <div className="relative w-[52px] h-[52px] shrink-0">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-full h-full rounded-full object-cover bg-ios-card2"
              />
              {t.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-ios-green border-2 border-white" />
              )}
            </div>

            <div className="flex-1 min-w-0 border-b border-black/5 pb-2.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[16px] font-semibold text-black truncate">
                  {t.name}
                </span>
                <span className="text-[13px] text-ios-gray shrink-0 ml-2">
                  {LAST_MESSAGE_TIME[t.id]}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[14px] text-ios-gray truncate pr-2">
                  {LAST_MESSAGE_PREVIEW[t.id]}
                </span>
                {t.unread > 0 && (
                  <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-ios-green text-white text-[12px] font-semibold flex items-center justify-center">
                    {t.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ---- Chat bubble ---------------------------------------------------------

function Bubble({ msg, avatar }: { msg: ChatMessage; avatar: string }) {
  const isMe = msg.from === "me";
  return (
    <div className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
      {!isMe && (
        <img
          src={avatar}
          alt=""
          className="w-7 h-7 rounded-full object-cover shrink-0 mb-1 bg-ios-card2"
        />
      )}
      <div className={cn("flex items-end gap-1.5 max-w-[78%]", isMe && "flex-row-reverse")}>
        <div
          className={cn(
            "px-3.5 py-2 text-[14.5px] leading-snug shadow-sm break-words",
            isMe
              ? "bg-[#2bd465] text-white rounded-2xl rounded-br-[4px]"
              : "bg-white text-black rounded-2xl rounded-bl-[4px]"
          )}
        >
          {msg.text}
        </div>
        <span className="text-[10px] text-white/80 mb-0.5 shrink-0 whitespace-nowrap">
          {isMe && msg.read ? "Read" : msg.time}
        </span>
      </div>
    </div>
  );
}

// ---- Chat detail screen ---------------------------------------------------

function ChatDetail({
  thread,
  messages,
  draft,
  setDraft,
  onSend,
  onBack,
  keyboardOpen,
  setKeyboardOpen,
}: {
  thread: Thread;
  messages: ChatMessage[];
  draft: string;
  setDraft: (v: string) => void;
  onSend: () => void;
  onBack: () => void;
  keyboardOpen: boolean;
  setKeyboardOpen: (v: boolean) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const insertChar = (char: string) => setDraft(draft + char);
  const backspace = () => setDraft(draft.slice(0, -1));

  return (
    <motion.div
      key="chat"
      initial={{ x: "100%" }}
      animate={{ x: 0, transition: { type: "spring", stiffness: 380, damping: 38 } }}
      exit={{ x: "100%", transition: { duration: 0.26 } }}
      className="absolute inset-0 z-20 bg-white flex flex-col"
    >
      <StatusBar dark />

      {/* Header */}
      <div className="pt-14 pb-2 px-3 flex items-center gap-1 border-b border-black/10 bg-white">
        <button onClick={onBack} className="flex items-center text-ios-blue px-1 py-1">
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
            <path d="M10 2L2 10l8 8" stroke="#0a84ff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1 flex flex-col items-center">
          <div className="relative w-9 h-9">
            <img src={thread.avatar} alt={thread.name} className="w-full h-full rounded-full object-cover bg-ios-card2" />
            {thread.online && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-ios-green border-2 border-white" />
            )}
          </div>
          <span className="text-[13px] font-semibold text-black mt-0.5">{thread.name}</span>
          <span className="text-[11px] text-ios-gray">{thread.online ? "Online" : "Offline"}</span>
        </div>
        <div className="w-7" />
      </div>

      {/* Scrollable thread, shrinks automatically when the keyboard opens below */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2.5"
        style={{ backgroundColor: "#849cc4" }}
      >
        {messages.map((m) => (
          <Bubble key={m.id} msg={m} avatar={thread.avatar} />
        ))}
      </div>

      {/* Input strip */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-t border-black/10">
        <button className="w-8 h-8 rounded-full border-2 border-ios-gray flex items-center justify-center shrink-0">
          <span className="text-ios-gray text-[20px] leading-none -mt-0.5">+</span>
        </button>

        <div className="flex-1 flex items-center bg-[#f0f0f0] rounded-full px-3.5 h-9">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setKeyboardOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSend();
            }}
            placeholder="iMessage"
            readOnly
            className="flex-1 bg-transparent outline-none text-[15px] text-black placeholder:text-ios-gray"
          />
        </div>

        {draft.trim().length > 0 ? (
          <button
            onClick={onSend}
            className="w-8 h-8 rounded-full bg-ios-blue flex items-center justify-center shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h9M7 3l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <>
            <button className="shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="7" width="18" height="13" rx="2.5" stroke="#8e8e93" strokeWidth="1.6" />
                <circle cx="12" cy="13.5" r="3.3" stroke="#8e8e93" strokeWidth="1.6" />
              </svg>
            </button>
            <button className="shrink-0">
              <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
                <rect x="6" y="1" width="8" height="13" rx="4" stroke="#8e8e93" strokeWidth="1.6" />
                <path d="M2 11a8 8 0 0016 0M10 19v2" stroke="#8e8e93" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </>
        )}
      </div>

      <AnimatePresence>
        {keyboardOpen && (
          <VirtualKeyboard onKey={insertChar} onBackspace={backspace} onSend={onSend} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---- Root component --------------------------------------------------

export default function IMessageApp() {
  const closeApp = usePhoneStore((s) => s.closeApp);

  const [view, setView] = useState<"list" | "chat">("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [messagesByThread, setMessagesByThread] =
    useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const activeThread = threads.find((t) => t.id === activeId) ?? null;

  const openThread = (id: string) => {
    setActiveId(id);
    setView("chat");
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t)));
  };

  const backToList = () => {
    setView("list");
    setKeyboardOpen(false);
  };

  const sendMessage = () => {
    if (!draft.trim() || !activeId) return;
    const newMsg: ChatMessage = {
      id: `${activeId}-${Date.now()}`,
      from: "me",
      text: draft.trim(),
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      read: false,
    };
    setMessagesByThread((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] ?? []), newMsg],
    }));
    setDraft("");
  };

  return (
    <div className="absolute inset-0 bg-white overflow-hidden">
      <AnimatePresence initial={false}>
        <ConversationList key="list-screen" threads={threads} onOpen={openThread} onClose={closeApp} />
      </AnimatePresence>

      <AnimatePresence>
        {view === "chat" && activeThread && (
          <ChatDetail
            key="chat-screen"
            thread={activeThread}
            messages={messagesByThread[activeThread.id] ?? []}
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
