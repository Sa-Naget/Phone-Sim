"use client";

import { useMemo } from "react";
import { motion, PanInfo } from "framer-motion";
import { usePhoneStore } from "../../store/usePhoneStore";
import { HOME_WALLPAPER_BACKGROUND } from "../../lib/wallpaper";
import { cn } from "@/lib/utils";
import StatusBar from "./StatusBar";

export interface AppDef {
  id: string;
  name: string;
  icon: string;
}

const PAGE_1_APPS: AppDef[] = [
  { id: "messages", name: "Messages", icon: "/icons/messages.svg" },
  { id: "whatsapp", name: "WhatsApp", icon: "/icons/whatsapp.svg" },
  { id: "notes", name: "Notes", icon: "/icons/notes.svg" },
  { id: "calendar", name: "Calendar", icon: "/icons/calendar.svg" },
  { id: "firefox", name: "Firefox", icon: "/icons/firefox.svg" },
  { id: "appstore", name: "App Store", icon: "/icons/appstore.svg" },
  { id: "gallery", name: "Photos", icon: "/icons/gallery.svg" },
];

const DOCK: AppDef[] = [
  { id: "messages", name: "Messages", icon: "/icons/messages.svg" },
  { id: "firefox", name: "Firefox", icon: "/icons/firefox.svg" },
  { id: "music", name: "Music", icon: "/icons/music.svg" },
  { id: "instagram", name: "Instagram", icon: "/icons/instagram.svg" },
];

const TOTAL_PAGES = 2;

function AppIcon({ app }: { app: AppDef }) {
  const openApp = usePhoneStore((s) => s.openApp);
  const unread = usePhoneStore((s) => s.unreadCounts[app.id] ?? 0);

  return (
    <button
      onClick={() => openApp(app.id)}
      onDoubleClick={(e) => e.stopPropagation()}
      className="flex flex-col items-center gap-1.5 select-none active:scale-90 transition-transform"
    >
      <div className="relative w-[58px] h-[58px] rounded-appicon overflow-hidden shadow-lg">
        <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-ios-red text-white text-[11px] font-semibold flex items-center justify-center">
            {unread}
          </span>
        )}
      </div>
      <span className="text-white text-[12px] font-medium tracking-tight drop-shadow">
        {app.name}
      </span>
    </button>
  );
}

function DockIcon({ app }: { app: AppDef }) {
  const openApp = usePhoneStore((s) => s.openApp);
  const unread = usePhoneStore((s) => s.unreadCounts[app.id] ?? 0);

  return (
    <button
      onClick={() => openApp(app.id)}
      onDoubleClick={(e) => e.stopPropagation()}
      className="select-none active:scale-90 transition-transform"
    >
      <div className="relative w-[58px] h-[58px] rounded-appicon overflow-hidden shadow-lg">
        <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-ios-red text-white text-[11px] font-semibold flex items-center justify-center">
            {unread}
          </span>
        )}
      </div>
    </button>
  );
}

function Widget({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] overflow-hidden shadow-lg bg-ios-card2",
        className
      )}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
}

// Custom countdown card — pass EITHER targetDate (auto-calculates days
// remaining live from Date.now(), recomputed on every render/page visit)
// OR fixedDaysLeft (a hardcoded number, useful for locking the count to a
// specific narrative beat regardless of the reader's real-world clock).
// If both are given, fixedDaysLeft wins — it's the explicit override.
interface CountdownWidgetProps {
  title: string; // e.g. "Nora's Day <3"
  dateLabel: string; // display string, e.g. "6 August 2027" — shown as-is,
  // independent of targetDate's format, so you can phrase it however you like
  targetDate?: string; // ISO date string, e.g. "2027-08-06", used for the
  // automatic calculation
  fixedDaysLeft?: number; // hardcode to override the calculation entirely
  graphicSrc: string; // decorative asset — cactus, sweet treats, etc.
  graphicAlt?: string;
}

function CountdownWidget({
  title,
  dateLabel,
  targetDate,
  fixedDaysLeft,
  graphicSrc,
  graphicAlt = "",
}: CountdownWidgetProps) {
  const daysLeft = useMemo(() => {
    if (fixedDaysLeft !== undefined) return fixedDaysLeft;
    if (!targetDate) return null;
    const diffMs = new Date(targetDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [targetDate, fixedDaysLeft]);

  return (
    <div
      onDoubleClick={(e) => e.stopPropagation()}
      className="h-[140px] rounded-[26px] bg-gradient-to-br from-[#ffd9ec] to-[#ffc0dd] px-5 py-4 flex items-center justify-between shadow-lg overflow-hidden shrink-0"
    >
      <div className="flex flex-col justify-center min-w-0">
        <span className="text-[#8a3b5e] text-[15px] font-semibold tracking-tight truncate">
          {title}
        </span>
        <span className="text-[#b5587e] text-[12px] font-medium mt-0.5">
          {dateLabel}
        </span>
        {daysLeft !== null && (
          <span className="text-[#6b2847] text-[30px] font-bold tracking-tight mt-1.5 leading-none">
            {daysLeft}
            <span className="text-[14px] font-semibold ml-1.5 align-middle">
              days left
            </span>
          </span>
        )}
      </div>
      <img
        src={graphicSrc}
        alt={graphicAlt}
        className="w-[76px] h-[76px] object-contain shrink-0 ml-3"
      />
    </div>
  );
}

function HomePage1() {
  return (
    <div className="w-full h-full shrink-0 px-6 grid grid-cols-4 auto-rows-[82px] gap-x-4 gap-y-4 content-start">
      <Widget
        src="/images/page1-banner.jpeg"
        alt="Story banner"
        className="col-span-4 row-span-2"
      />

      <Widget
        src="/images/widget-photo-placeholder.jpeg"
        alt="Character avatar"
        className="col-span-2 row-span-2"
      />

      {PAGE_1_APPS.map((app) => (
        <AppIcon key={app.id} app={app} />
      ))}
    </div>
  );
}

function HomePage2() {
  return (
    <div className="w-full h-full shrink-0 px-6 flex flex-col gap-4 content-start overflow-y-auto">
      {/* 1. Top image widget — character illustration / anime-style profile */}
      <Widget
        src="/images/page2-siblings.jpeg"
        alt="Character illustration"
        className="h-[230px] rounded-[28px] shrink-0"
      />

      {/* 2. Middle countdown widget — swap targetDate for fixedDaysLeft
          (or pass both; fixedDaysLeft always wins) depending on whether
          you want this live-calculated or pinned for the story */}
      <CountdownWidget
        title="Nora's Day <3"
        dateLabel="6 August 2027"
        targetDate="2027-08-06"
        // fixedDaysLeft={285} // uncomment to hardcode instead of calculating
        graphicSrc="/images/countdown.png"
        graphicAlt="Decorative cactus"
      />

      {/* 3. Bottom image widget — scenic friend-group silhouette landscape */}
      <Widget
        src="/images/page2-friends.jpeg"
        alt="Friends silhouette against the sky"
        className="h-[180px] rounded-[28px] shrink-0"
      />
    </div>
  );
}

export default function HomeScreen() {
  const homePage = usePhoneStore((s) => s.homePage);
  const setHomePage = usePhoneStore((s) => s.setHomePage);
  const lockPhone = usePhoneStore((s) => s.lockPhone);

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const distanceThreshold = 60;
    const velocityThreshold = 400;
    let next = homePage;

    if (
      (info.offset.x < -distanceThreshold || info.velocity.x < -velocityThreshold) &&
      homePage < TOTAL_PAGES - 1
    ) {
      next += 1;
    } else if (
      (info.offset.x > distanceThreshold || info.velocity.x > velocityThreshold) &&
      homePage > 0
    ) {
      next -= 1;
    }
    setHomePage(next);
  };

  return (
    <div className="absolute inset-0 z-30 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: HOME_WALLPAPER_BACKGROUND }}
      />

      <div className="absolute inset-0 flex flex-col">
        <StatusBar />

        <div
          onDoubleClick={() => lockPhone()}
          className="flex-1 pt-14 pb-2 overflow-hidden"
        >
          <motion.div
            className="flex h-full"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            animate={{ x: `-${homePage * 100}%` }}
            transition={{ type: "spring", stiffness: 340, damping: 32, mass: 0.9 }}
            onDragEnd={handleDragEnd}
          >
            <HomePage1 />
            <HomePage2 />
          </motion.div>

          <div className="flex justify-center gap-1.5 mt-2">
            {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === homePage ? "bg-white" : "bg-white/40"
                  }`}
              />
            ))}
          </div>
        </div>

        <div
          onDoubleClick={(e) => e.stopPropagation()}
          className="mx-3 mb-2 rounded-[2rem] bg-white/15 backdrop-blur-xl border border-white/10 px-5 py-3 flex justify-between shadow-lg"
        >
          {DOCK.map((app) => (
            <DockIcon key={app.id} app={app} />
          ))}
        </div>

        <div className="mb-2 flex justify-center">
          <div className="w-32 h-1.5 rounded-full bg-white/80" />
        </div>
      </div>
    </div>
  );
}
