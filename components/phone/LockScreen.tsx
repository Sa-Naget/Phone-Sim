"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, PanInfo, useAnimation } from "framer-motion";
import { usePhoneStore } from "../../store/usePhoneStore";

// Change this to match your story character (4 or 6 digits both work —
// the dot grid and keypad layout adapt automatically to this length).
const CORRECT_PASSCODE = "0000";

type LockView = "clock" | "passcode";

export default function LockScreen() {
  const unlock = usePhoneStore((s) => s.unlock);
  const controls = useAnimation();

  const [view, setView] = useState<LockView>("clock");
  const [entered, setEntered] = useState<string[]>([]);
  const [error, setError] = useState(false);

  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: false,
        })
      );
      setDate(
        now.toLocaleDateString([], {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      );
    };
    update();
    const id = setInterval(update, 1000 * 15);
    return () => clearInterval(id);
  }, []);

  // --- Swipe up on the clock view transitions into the passcode pad ---
  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y < -80 || info.velocity.y < -450) {
      setView("passcode");
      controls.set({ y: 0 }); // reset drag offset for next time we return here
    } else {
      controls.start({
        y: 0,
        transition: { type: "spring", stiffness: 400, damping: 35 },
      });
    }
  };

  // --- Passcode entry logic ---
  const handleDigit = (digit: string) => {
    if (entered.length >= CORRECT_PASSCODE.length) return;
    const next = [...entered, digit];
    setEntered(next);

    if (next.length === CORRECT_PASSCODE.length) {
      if (next.join("") === CORRECT_PASSCODE) {
        setTimeout(() => unlock(), 180);
      } else {
        setError(true);
        setTimeout(() => {
          setError(false);
          setEntered([]);
        }, 480);
      }
    }
  };

  const handleDelete = () => {
    setEntered((prev) => prev.slice(0, -1));
  };

  return (
    <div className="absolute inset-0 z-40 overflow-hidden">
      <AnimatePresence initial={false} mode="wait">
        {view === "clock" ? (
          <motion.div
            key="clock-view"
            animate={controls}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            initial={{ y: 0 }}
            exit={{ y: "-100%", transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] } }}
            className="absolute inset-0 flex flex-col items-center bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(180deg, #2b2440 0%, #141022 60%, #05040a 100%)",
            }}
          >
            <div className="h-11" />

            <div className="mt-6 flex flex-col items-center text-white select-none">
              <span className="text-[17px] font-medium opacity-90">{date}</span>
              <span className="text-[96px] font-semibold leading-none tracking-tight mt-1">
                {time}
              </span>
            </div>

            <div className="mt-8 w-[88%] space-y-2">
              {/* Example notification card:
              <div className="bg-white/20 backdrop-blur-xl rounded-2xl px-4 py-3 text-white">
                <p className="text-sm font-semibold">Messages</p>
                <p className="text-sm opacity-90">New message from Aiko</p>
              </div>
              */}
            </div>

            <div className="flex-1" />

            <div className="w-full flex justify-between px-7 mb-9">
              <button
                aria-label="Flashlight"
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center active:scale-90 transition-transform"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 2h6l-1 7h3l-8 13 2-9H7l2-11z"
                    stroke="white"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </button>
              <button
                aria-label="Camera"
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center active:scale-90 transition-transform"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="7" width="18" height="13" rx="2.5" stroke="white" strokeWidth="1.6" />
                  <circle cx="12" cy="13.5" r="3.3" stroke="white" strokeWidth="1.6" />
                  <path d="M8.5 7l1.2-2.2h4.6L15.5 7" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="mb-3 flex flex-col items-center text-white/80 select-none">
              <div className="w-32 h-1.5 rounded-full bg-white/80 mb-2" />
              <span className="text-[13px]">Swipe up to unlock</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="passcode-view"
            initial={{ y: "100%" }}
            animate={{ y: 0, transition: { type: "spring", stiffness: 380, damping: 36 } }}
            exit={{ y: "100%", transition: { duration: 0.25 } }}
            className="absolute inset-0 flex flex-col items-center bg-[#0b0712]"
          >
            <div className="h-11" />

            <button
              onClick={() => {
                setEntered([]);
                setView("clock");
              }}
              className="self-end mr-6 mt-3 text-[15px] text-white/80"
            >
              Cancel
            </button>

            <div className="mt-10 flex flex-col items-center text-white select-none">
              <span className="text-[17px] font-medium mb-7">
                {error ? "Try again" : "Enter Passcode"}
              </span>

              <motion.div
                animate={error ? { x: [0, -10, 10, -10, 10, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className="flex gap-5"
              >
                {Array.from({ length: CORRECT_PASSCODE.length }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full border border-white/70 ${
                      i < entered.length
                        ? error
                          ? "bg-ios-red border-ios-red"
                          : "bg-white"
                        : "bg-transparent"
                    }`}
                  />
                ))}
              </motion.div>
            </div>

            <div className="flex-1" />

            <div className="grid grid-cols-3 gap-x-7 gap-y-4 mb-10">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDigit(d)}
                  className="w-[72px] h-[72px] rounded-full bg-white/15 text-white text-[30px] font-light active:bg-white/30 transition-colors select-none"
                >
                  {d}
                </button>
              ))}
              <div />
              <button
                onClick={() => handleDigit("0")}
                className="w-[72px] h-[72px] rounded-full bg-white/15 text-white text-[30px] font-light active:bg-white/30 transition-colors select-none"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                className="w-[72px] h-[72px] flex items-center justify-center text-white/80 active:text-white transition-colors select-none"
                aria-label="Delete"
              >
                <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
                  <path
                    d="M9 1h15a1 1 0 011 1v16a1 1 0 01-1 1H9L1 10l8-9z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.5 6.5l6 6M19.5 6.5l-6 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
