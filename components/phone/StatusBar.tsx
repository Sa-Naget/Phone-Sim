"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StatusBarProps {
  dark?: boolean;
}

export default function StatusBar({ dark = false }: StatusBarProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    update();
    const id = setInterval(update, 1000 * 15);
    return () => clearInterval(id);
  }, []);

  const iconColor = dark ? "#000000" : "#ffffff";

  return (
    <div
      className={cn(
        "absolute top-0 left-0 right-0 z-50 grid grid-cols-3 items-center px-6 pt-3 h-11 font-sf select-none",
        dark ? "text-black" : "text-white"
      )}
    >
      <span className="justify-self-start text-[15px] font-semibold tracking-tight tabular-nums">
        {time}
      </span>

      <span className="justify-self-center" />

      <div className="justify-self-end flex items-center gap-1.5">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={i * 4.5}
              y={12 - (i + 1) * 2.6}
              width="3.2"
              height={(i + 1) * 2.6}
              rx="0.8"
              fill={iconColor}
            />
          ))}
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 10.2a1.1 1.1 0 100-2.2 1.1 1.1 0 000 2.2z" fill={iconColor} />
          <path
            d="M4.8 6.8a4.6 4.6 0 016.4 0"
            stroke={iconColor}
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M2.2 4.2a8.2 8.2 0 0111.6 0"
            stroke={iconColor}
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <svg width="26" height="13" viewBox="0 0 26 13" fill="none">
          <rect x="0.5" y="0.5" width="21" height="12" rx="3.5" stroke={iconColor} strokeOpacity="0.5" />
          <rect x="2" y="2" width="16" height="9" rx="2" fill={iconColor} />
          <path d="M23 4.5v4a1.8 1.8 0 000-4z" fill={iconColor} fillOpacity="0.5" />
        </svg>
      </div>
    </div>
  );
}
