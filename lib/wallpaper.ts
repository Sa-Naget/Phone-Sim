// Wallpaper sources for each screen. Real iOS actually treats lockscreen
// and homescreen wallpapers as independent choices, so having two
// constants here matches that — LockScreen.tsx and HomeScreen.tsx each
// import only the one they need.

const LEGIBILITY_GRADIENT =
  "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.55) 100%)";

export const LOCK_WALLPAPER_BACKGROUND =
  `${LEGIBILITY_GRADIENT}, url('/images/lockscreen.jpeg')`;

export const HOME_WALLPAPER_BACKGROUND =
  `${LEGIBILITY_GRADIENT}, url('/images/homescreen.jpeg')`;

// If you want both screens to share the same image again later, just
// point both exports at the same url(...) — no component changes needed.
