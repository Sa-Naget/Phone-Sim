"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePhoneStore } from "@/store/usePhoneStore";
import LockScreen from "./LockScreen";
import HomeScreen from "./HomeScreen";
import StatusBar from "./StatusBar";
import IMessageApp from "../apps/IMessage";
import InstagramApp from "../apps/Instagram";
import WhatsAppApp from "../apps/Whatsapp";

// Placeholder registry — each real app component gets wired in here later.
// Keeping it data-driven means adding "Instagram.tsx" later is a 2-line change.
const APP_REGISTRY: Record<string, () => JSX.Element> = {
  messages: () => <IMessageApp />,
  instagram: () => <InstagramApp />,
  whatsapp: () => <WhatsAppApp />,
  // ...
};

function AppPlaceholder({ appId }: { appId: string }) {
  const closeApp = usePhoneStore((s) => s.closeApp);
  return (
    <div className="absolute inset-0 bg-black flex flex-col">
      <StatusBar dark={false} />
      <div className="flex-1 flex items-center justify-center text-white/60 text-sm px-8 text-center">
        “{appId}” app goes here — next step once the core shell is approved.
      </div>
      <button
        onClick={closeApp}
        className="mb-8 mx-auto text-white/70 text-sm"
      >
        ‹ Close
      </button>
    </div>
  );
}

export default function PhoneContainer() {
  const screen = usePhoneStore((s) => s.screen);
  const openAppId = usePhoneStore((s) => s.openAppId);

  const ActiveApp = openAppId ? APP_REGISTRY[openAppId] : undefined;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] py-10">
      {/* Physical device bezel */}
      <div className="relative w-[390px] h-[844px] rounded-phone bg-black shadow-phone overflow-hidden select-none">
        {/* Screen clip */}
        <div className="absolute inset-[2px] rounded-screen overflow-hidden bg-black">
          <AnimatePresence initial={false}>
            {screen === "lock" && <LockScreen key="lock" />}
          </AnimatePresence>

          {/* Homescreen stays mounted beneath apps so state (scroll, page) persists */}
          {screen !== "lock" && <HomeScreen key="home" />}

          <AnimatePresence>
            {screen === "app" && openAppId && (
              <motion.div
                key={openAppId}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 38 }}
                className="absolute inset-0 z-50"
              >
                {ActiveApp ? <ActiveApp /> : <AppPlaceholder appId={openAppId} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hardware notch/Dynamic Island cutout decoration (visual only, status bar draws its own) */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-b-[20px] z-[60]" />
      </div>
    </div>
  );
}
