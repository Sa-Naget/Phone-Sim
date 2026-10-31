"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { usePhoneStore } from "../../store/usePhoneStore";
import { cn } from "@/lib/utils";
import StatusBar from "../phone/StatusBar";

// ---- Data model --------------------------------------------------------

interface Thread {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  unread: number;
}

interface ChatMessage {
  id: string;
  from: "me" | "them";
  time: string; // display clock time, e.g. "9:41 AM"
  day: string; // display day label, e.g. "Today" / "Yesterday" — drives the
  // date divider: a divider renders whenever this changes between
  // consecutive messages, independent of the time string above
  type?: "text" | "sticker"; // defaults to "text"
  text?: string; // required for text messages, ignored for stickers
  stickerSrc?: string; // required for sticker messages
  read?: boolean;
}

const INITIAL_THREADS: Thread[] = [
  {
    id: "agetta",
    name: "Mas Agettaaaaaa",
    avatar: "/avatars/agetta.jpeg",
    online: true,
    unread: 2,
  },
  {
    id: "utami",
    name: "Bukan Utama",
    avatar: "/avatars/utami.jpeg",
    online: false,
    unread: 2,
  },
  {
    id: "group-ruhesa",
    name: "Bagi Bagi Dageng😹✌🏻",
    avatar: "/avatars/group.jpeg",
    online: false,
    unread: 5,
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  agetta: [
    { id: "a1", from: "them", text: "did you get home okay?", time: "9:38 AM", day: "Today" },
    { id: "a2", from: "me", text: "yap yap, just got hereee", time: "9:40 AM", day: "Today", read: true },
    { id: "a3", from: "them", text: "good. text me tomorrow", time: "9:41 AM", day: "Today" },
  ],
  utami: [
    { id: "n1", from: "them", text: "yo we're meeting up at 9 tmrw", time: "6:02 PM", day: "Yesterday" },
    { id: "n2", from: "them", text: "also don't forget to turn in your homework", time: "6:03 PM", day: "Yesterday" },
  ],
  "group-ruhesa": [
    { id: "g1", from: "them", text: "where are you guys??", time: "2:14 PM", day: "Yesterday" },
    { id: "g2", from: "them", text: "hellooo??", time: "2:15 PM", day: "Yesterday" },
    {
      id: "g3",
      from: "them",
      type: "sticker",
      stickerSrc: "/stickers/panic.png",
      time: "2:16 PM",
      day: "Yesterday",
    },
    { id: "g4", from: "them", text: "ok fine we'll wait", time: "9:02 AM", day: "Today" },
  ],
};

const AUTO_REPLY: Record<string, string> = {
  agetta: "haha stop texting me so late",
  utami: "ok noted, don't be late!",
  "group-ruhesa": "FINALLY 😭 where were you",
};

// ---- Virtual keyboard ---------------------------------------------------

const ROW_1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
const ROW_2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
const ROW_3 = ["z", "x", "c", "v", "b", "n", "m"];

const NUM_ROW_1 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const NUM_ROW_2 = ["-", "/", ":", ";", "(", ")", "$", "&", "@", '"'];
const NUM_ROW_3 = [".", ",", "?", "!", "'"];

function VirtualKeyboard({
  onKey,
  onBackspace,
  onSend,
}: {
  onKey: (char: string) => void;
  onBackspace: () => void;
  onSend: () => void;
}) {
  const [layer, setLayer] = useState<"letters" | "numbers">("letters");
  const [shiftOn, setShiftOn] = useState(false);

  const typeLetter = (letter: string) => {
    onKey(shiftOn ? letter.toUpperCase() : letter);
    if (shiftOn) setShiftOn(false);
  };

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
                <KeyButton
                  key={k}
                  label={shiftOn ? k.toUpperCase() : k}
                  onClick={() => typeLetter(k)}
                />
              ))}
            </div>
            <div className="flex justify-center gap-[6px] px-4">
              {ROW_2.map((k) => (
                <KeyButton
                  key={k}
                  label={shiftOn ? k.toUpperCase() : k}
                  onClick={() => typeLetter(k)}
                />
              ))}
            </div>
            <div className="flex justify-center gap-[6px]">
              <KeyButton
                label="⇧"
                wide
                active={shiftOn}
                onClick={() => setShiftOn((v) => !v)}
              />
              {ROW_3.map((k) => (
                <KeyButton
                  key={k}
                  label={shiftOn ? k.toUpperCase() : k}
                  onClick={() => typeLetter(k)}
                />
              ))}
              <KeyButton label="⌫" wide onClick={onBackspace} />
            </div>
            <div className="flex gap-[6px] px-1">
              <KeyButton label="123" wide onClick={() => setLayer("numbers")} />
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
            <div className="flex gap-[6px] px-1">
              <KeyButton label="ABC" wide onClick={() => setLayer("letters")} />
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
          </>
        )}
      </div>
    </motion.div>
  );
}

function KeyButton({
  label,
  onClick,
  wide = false,
  active = false,
}: {
  label: string;
  onClick: () => void;
  wide?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-[42px] rounded-[6px] shadow text-[18px] font-normal select-none active:bg-gray-200 flex items-center justify-center",
        active ? "bg-white/70 text-ios-blue" : "bg-white text-black",
        wide ? "w-[42px] text-[14px]" : "flex-1"
      )}
    >
      {label}
    </button>
  );
}

// ---- Conversations list screen -----------------------------------------

function getLastMessagePreview(messages: ChatMessage[]): { text: string; time: string } {
  const last = messages[messages.length - 1];
  if (!last) return { text: "", time: "" };
  return {
    text: last.type === "sticker" ? "Sticker" : last.text ?? "",
    time: last.time,
  };
}

function ConversationList({
  threads,
  messagesByThread,
  onOpen,
  onClose,
}: {
  threads: Thread[];
  messagesByThread: Record<string, ChatMessage[]>;
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

        <div className="mt-2 mb-1 flex items-center gap-1.5 bg-[#e9e9eb] rounded-[10px] px-3 h-9">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="#8e8e93" strokeWidth="1.6" />
            <path d="M10.3 10.3L13 13" stroke="#8e8e93" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="text-[15px] text-ios-gray">Search</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
                {threads.map((t) => {
                  const preview = getLastMessagePreview(messagesByThread[t.id] ?? []);
                  return (
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
                            {preview.time}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[14px] text-ios-gray truncate pr-2">
                            {preview.text}
                          </span>
                          {t.unread > 0 && (
                            <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-ios-green text-white text-[12px] font-semibold flex items-center justify-center">
                              {t.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
      </div>
    </motion.div>
  );
}

// ---- Chat bubble ---------------------------------------------------------

function Bubble({
  msg,
  avatar,
  showAvatar = true,
}: {
  msg: ChatMessage;
  avatar: string;
  showAvatar?: boolean;
}) {
  const isMe = msg.from === "me";
  const isSticker = msg.type === "sticker";

  return (
    <div className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
      {!isMe &&
        (showAvatar ? (
          <img
            src={avatar}
            alt=""
            className="w-7 h-7 rounded-full object-cover shrink-0 mb-1 bg-ios-card2"
          />
        ) : (
          <div className="w-7 shrink-0" />
        ))}
      <div
        className={cn(
          "flex items-end gap-1.5",
          isMe && "flex-row-reverse",
          isSticker ? "max-w-[150px]" : "max-w-[78%]"
        )}
      >
        {isSticker ? (
          <img
            src={msg.stickerSrc}
            alt="sticker"
            className="w-[130px] h-[130px] object-contain drop-shadow-md select-none"
          />
        ) : (
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
        )}
        <span className="text-[10px] text-white/80 mb-0.5 shrink-0 whitespace-nowrap">
          {isMe && msg.read ? "Read" : msg.time}
        </span>
      </div>
    </div>
  );
}

function TypingBubble({ avatar }: { avatar: string }) {
  return (
    <div className="flex items-end gap-2 justify-start">
      <img
        src={avatar}
        alt=""
        className="w-7 h-7 rounded-full object-cover shrink-0 mb-1 bg-ios-card2"
      />
      <div className="bg-white rounded-2xl rounded-bl-[4px] px-4 py-3 shadow-sm flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-gray-400"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex justify-center my-3">
      <span className="px-3 py-1 rounded-full bg-black/15 text-white text-[11px] font-medium tracking-wide">
        {label}
      </span>
    </div>
  );
}

// ---- Chat detail screen ---------------------------------------------------

function ChatDetail({
  thread,
  messages,
  isTyping,
  draft,
  setDraft,
  onSend,
  onBack,
  keyboardOpen,
  setKeyboardOpen,
}: {
  thread: Thread;
  messages: ChatMessage[];
  isTyping: boolean;
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

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, keyboardOpen, isTyping]);

  return (
    <motion.div
      key="chat"
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

      <div className="relative pt-14 pb-2 px-3 flex items-center border-b border-black/10 bg-white">
        <button
          onClick={onBack}
          className="relative z-10 flex items-center gap-0.5 text-ios-blue active:opacity-60"
        >
          <svg width="11" height="18" viewBox="0 0 12 20" fill="none">
            <path d="M10 2L2 10l8 8" stroke="#0a84ff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[17px] -ml-0.5">Messages</span>
        </button>

        <div className="absolute inset-0 pt-14 pb-2 flex flex-col items-center justify-center pointer-events-none">
          <div className="relative w-9 h-9">
            <img src={thread.avatar} alt={thread.name} className="w-full h-full rounded-full object-cover bg-ios-card2" />
            {thread.online && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-ios-green border-2 border-white" />
            )}
          </div>
          <span className="text-[13px] font-semibold text-black mt-0.5">{thread.name}</span>
          <span className="text-[11px] text-ios-gray">
            {isTyping ? "typing…" : thread.online ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        onClick={() => keyboardOpen && setKeyboardOpen(false)}
        className="flex-1 min-h-0 overflow-y-auto px-3 py-3"
        style={{ backgroundColor: "#849cc4" }}
      >
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const isGroupStart = !prev || prev.from !== m.from;
          const isGroupEnd = !next || next.from !== m.from;
          const showDivider = !prev || prev.day !== m.day;

          return (
            <div key={m.id}>
              {showDivider && <DateDivider label={m.day} />}
              <div
                className={cn(
                  showDivider || i === 0 ? "mt-0" : isGroupStart ? "mt-3" : "mt-1"
                )}
              >
                <Bubble msg={m} avatar={thread.avatar} showAvatar={isGroupEnd} />
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="mt-3">
            <TypingBubble avatar={thread.avatar} />
          </div>
        )}
      </div>

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
  const [typingThreadId, setTypingThreadId] = useState<string | null>(null);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

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
    const threadId = activeId;

    const newMsg: ChatMessage = {
      id: `${threadId}-${Date.now()}`,
      from: "me",
      text: draft.trim(),
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      day: "Today",
      read: false,
    };
    setMessagesByThread((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] ?? []), newMsg],
    }));
    setDraft("");

    const t1 = setTimeout(() => setTypingThreadId(threadId), 700);
    const t2 = setTimeout(() => {
      setTypingThreadId(null);
      setMessagesByThread((prev) => ({
        ...prev,
        [threadId]: [
          ...(prev[threadId] ?? []),
          {
            id: `${threadId}-reply-${Date.now()}`,
            from: "them",
            text: AUTO_REPLY[threadId] ?? "...",
            time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            day: "Today",
          },
        ],
      }));
    }, 2300);
    timers.current.push(t1, t2);
  };

  return (
    <div className="absolute inset-0 bg-white overflow-hidden">
      <AnimatePresence initial={false}>
         <ConversationList
          key="list-screen"
          threads={threads}
          messagesByThread={messagesByThread}
          onOpen={openThread}
          onClose={closeApp}
        />
      </AnimatePresence>

      <AnimatePresence>
        {view === "chat" && activeThread && (
          <ChatDetail
            key="chat-screen"
            thread={activeThread}
            messages={messagesByThread[activeThread.id] ?? []}
            isTyping={typingThreadId === activeThread.id}
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
