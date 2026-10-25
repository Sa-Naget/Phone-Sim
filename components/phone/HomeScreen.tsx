"use client";

import { motion, PanInfo } from "framer-motion";
import { usePhoneStore } from "../../store/usePhoneStore";
import { HOME_WALLPAPER_BACKGROUND } from "../../lib/wallpaper";
import { cn } from "@/lib/utils";
import StatusBar from "./StatusBar";

export interface AppDef {
  id: string;
  name: string;
  icon: string; // path under /public/icons/
}

// --- App icons used on Page 1's grid ---
const PAGE_1_APPS: AppDef[] = [
  { id: "messages", name: "Messages", icon: "/icons/messages.svg" },
  { id: "whatsapp", name: "WhatsApp", icon: "/icons/whatsapp.svg" },
  { id: "notes", name: "Notes", icon: "/icons/notes.svg" },
  { id: "calendar", name: "Calendar", icon: "/icons/calendar.svg" },
  { id: "firefox", name: "Firefox", icon: "/icons/firefox.svg" },
  // Music and Instagram already live in the dock, so they're deliberately
  // left out here. App Store and Gallery have no other home, so they land
  // on this page too — this is now every required app, reachable from
  // either the Page 1 grid or the dock.
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

function HomePage1() {
  return (
    <div className="w-full h-full shrink-0 px-6 grid grid-cols-4 auto-rows-[82px] gap-x-4 gap-y-4 content-start">
      <Widget
        src="/widgets/page1-banner.jpg"
        alt="Story banner"
        className="col-span-4 row-span-2"
      />

      <Widget
        src="/widgets/page1-avatar.jpg"
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
    <div className="w-full h-full shrink-0 px-6 grid grid-cols-4 auto-rows-[82px] gap-4 content-start">
      <Widget
        src="/widgets/page2-large.jpg"
        alt="Gallery large"
        className="col-start-1 col-span-2 row-start-1 row-span-4 rounded-[28px]"
      />

      <Widget
        src="/widgets/page2-small.jpg"
        alt="Gallery small"
        className="col-start-3 col-span-2 row-start-1 row-span-2 rounded-[20px]"
      />

      <Widget
        src="/widgets/page2-medium.jpg"
        alt="Gallery medium"
        className="col-start-1 col-span-4 row-start-5 row-span-2 rounded-[24px]"
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
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === homePage ? "bg-white" : "bg-white/40"
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
