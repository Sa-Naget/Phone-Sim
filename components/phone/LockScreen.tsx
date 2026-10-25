"use client";

import { useEffect, useState } from "react";
import { motion, PanInfo, useAnimation } from "framer-motion";
import { usePhoneStore } from "@/store/usePhoneStore";

export default function LockScreen() {
  const unlock = usePhoneStore((s) => s.unlock);
  const controls = useAnimation();
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

  // Threshold-based swipe-up to unlock
  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y < -90 || info.velocity.y < -500) {
      controls.start({ y: "-100%", transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] } }).then(unlock);
    } else {
      controls.start({ y: 0, transition: { type: "spring", stiffness: 400, damping: 35 } });
    }
  };

  return (
    <motion.div
      animate={controls}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.15}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 z-40 flex flex-col items-center bg-cover bg-center"
      style={{
        // Replace with a narrative-relevant wallpaper asset
        backgroundImage:
          "linear-gradient(180deg, #2b2440 0%, #141022 60%, #05040a 100%)",
      }}
    >
      <div className="mt-24 flex flex-col items-center text-white select-none">
        <span className="text-[17px] font-medium opacity-90">{date}</span>
        <span className="text-[86px] font-semibold leading-none tracking-tight mt-1">
          {time}
        </span>
      </div>

      {/* Notification stack placeholder — wire up real narrative notifications here */}
      <div className="mt-10 w-[88%] space-y-2">
        {/* Example notification card:
        <div className="bg-white/20 backdrop-blur-xl rounded-2xl px-4 py-3 text-white">
          <p className="text-sm font-semibold">Messages</p>
          <p className="text-sm opacity-90">New message from Aiko</p>
        </div>
        */}
      </div>

      <div className="flex-1" />

      <div className="mb-10 flex flex-col items-center text-white/80 select-none">
        <div className="w-9 h-9 rounded-full border border-white/50 flex items-center justify-center mb-2 animate-pulse">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1v12M2 6l5-5 5 5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-[13px]">Swipe up to unlock</span>
      </div>
    </motion.div>
  );
}
