// Single source of truth for the lockscreen/homescreen background so both
// screens always stay visually consistent. Swap this for a real
// background-image url('/wallpaper.jpg') once you have a narrative asset —
// everything downstream (LockScreen, HomeScreen) picks it up automatically.
export const WALLPAPER_BACKGROUND =
  "linear-gradient(180deg, #342a52 0%, #1b1430 55%, #0a0714 100%)";
