"use client";

import { motion, PanInfo, useAnimation } from "framer-motion";
import { usePhoneStore } from "../../store/usePhoneStore";
import StatusBar from "./StatusBar";

export interface AppDef {
  id: string;
  name: string;
  icon: string; // path under /public/icons/
  badge?: number;
}

const PAGE_1: AppDef[] = [
  { id: "messages", name: "Messages", icon: "/icons/messages.svg" },
  { id: "whatsapp", name: "WhatsApp", icon: "/icons/whatsapp.svg" },
  { id: "calendar", name: "Calendar", icon: "/icons/calendar.svg" },
  { id: "notes", name: "Notes", icon: "/icons/notes.svg" },
  { id: "appstore", name: "App Store", icon: "/icons/appstore.svg" },
  { id: "firefox", name: "Firefox", icon: "/icons/firefox.svg" },
  { id: "music", name: "Music", icon: "/icons/music.svg" },
  { id: "gallery", name: "Photos", icon: "/icons/gallery.svg" },
  { id: "instagram", name: "Instagram", icon: "/icons/instagram.svg" },
];
const PAGE_2: AppDef[] = [
  // second homescreen page — e.g. narrative/custom apps go here
];

const PAGES: AppDef[][] = [PAGE_1, PAGE_2];

const DOCK: AppDef[] = [
  { id: "messages", name: "Messages", icon: "/icons/messages.svg" },
  { id: "firefox", name: "Firefox", icon: "/icons/firefox.svg" },
  { id: "music", name: "Music", icon: "/icons/music.svg" },
  { id: "instagram", name: "Instagram", icon: "/icons/instagram.svg" },
];

function AppIcon({ app }: { app: AppDef }) {
  const openApp = usePhoneStore((s) => s.openApp);
  const unread = usePhoneStore((s) => s.unreadCounts[app.id] ?? 0);

  return (
    <button
      onClick={() => openApp(app.id)}
      onDoubleClick={(e) => e.stopPropagation()}
      className="flex flex-col items-center gap-1.5 select-none active:scale-90 transition-transform"
    >
      <div className="relative w-[58px] h-[58px] rounded-appicon overflow-hidden bg-ios-card2 shadow-lg">
        <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-ios-red text-white text-[11px] font-semibold flex items-center justify-center">
            {unread}
          </span>
        )}
      </div>
      <span className="text-white text-[12px] font-medium drop-shadow">
        {app.name}
      </span>
    </button>
  );
}

function PhotoWidget() {
  return (
    <div
      className="col-span-2 row-span-2 rounded-[24px] overflow-hidden shadow-lg bg-ios-card2"
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <img
        src="/icons/widget-photo-placeholder.jpg"
        alt="Memory"
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export default function HomeScreen() {
  const homePage = usePhoneStore((s) => s.homePage);
  const setHomePage = usePhoneStore((s) => s.setHomePage);
  const lockPhone = usePhoneStore((s) => s.lockPhone);
  const controls = useAnimation();

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 60;
    let next = homePage;
    if (info.offset.x < -threshold && homePage < PAGES.length - 1) next += 1;
    else if (info.offset.x > threshold && homePage > 0) next -= 1;
    setHomePage(next);
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col">
      <StatusBar />
      <div
        onDoubleClick={() => lockPhone()}
        className="flex-1 pt-14 pb-2 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #3a2f5c 0%, #1b1430 100%)",
        }}
      >
        <motion.div
          className="flex h-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          animate={{ x: `-${homePage * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onDragEnd={handleDragEnd}
        >
          {PAGES.map((pageApps, i) => (
            <div
              key={i}
              className="w-full shrink-0 px-6 grid grid-cols-4 gap-x-4 gap-y-5 content-start"
            >
              {i === 0 && <PhotoWidget />}
              {pageApps.map((app) => (
                <AppIcon key={app.id} app={app} />
              ))}
            </div>
          ))}
        </motion.div>

        <div className="flex justify-center gap-1.5 mt-2">
          {PAGES.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${
                i === homePage ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      <div
        onDoubleClick={(e) => e.stopPropagation()}
        className="mx-3 mb-2 rounded-[32px] bg-white/15 backdrop-blur-2xl px-5 py-3 flex justify-between"
      >
        {DOCK.map((app) => (
          <AppIcon key={app.id} app={app} />
        ))}
      </div>
      <div className="mb-2 flex justify-center">
        <div className="w-32 h-1.5 rounded-full bg-white/80" />
      </div>
    </div>
  );
}
