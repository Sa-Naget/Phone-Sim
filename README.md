# AU Phone Simulator — Core Shell

## What's built so far
- **PhoneContainer** — physical device bezel, notch, screen clipping, app-open slide-up transition
- **StatusBar** — live clock, signal/wifi/battery icons (dark/light variants)
- **LockScreen** — live clock/date, swipe-up-to-unlock gesture (drag threshold + velocity)
- **HomeScreen** — multi-page swipeable grid, photo widget slot, dock, page dots
- **usePhoneStore** (Zustand, persisted to localStorage) — lock state, open app, homescreen page, unread badges, story-start timestamp
- **storyClock.ts** — `useStoryElapsedMs()` hook + `afterMinutes()/afterHours()` helpers for time-delayed message reveals

## Setup
```bash
npm install
npm run dev
```
Open http://localhost:3000 — you'll land on the lockscreen; drag up to unlock.

## Deploying to Vercel
```bash
npx vercel
```
or connect the GitHub repo in the Vercel dashboard — zero config needed, Next.js is auto-detected.

## Next steps (not yet built)
1. Drop real icon SVGs/PNGs into `/public/icons/` (messages, whatsapp, calendar, notes,
   appstore, firefox, music, gallery, instagram) — placeholders will 404 until then.
2. Build each app as its own component in `components/apps/`, then register it in
   `APP_REGISTRY` inside `PhoneContainer.tsx` (one line each).
3. iMessage/WhatsApp: build the chat thread UI + the on-screen keyboard overlay
   (slides up via the same `slide-up` Tailwind animation already defined).
4. Author narrative chat data using `afterMinutes()`/`afterHours()` timestamps,
   filtered against `useStoryElapsedMs()` for the time-delayed reveal mechanic.
5. Wire `setUnread()` calls when a scheduled message "arrives" so the homescreen
   badge updates live.

## Design tokens
iOS color/radius/shadow tokens live in `tailwind.config.ts` under `theme.extend` —
edit there rather than hardcoding hex values in components.
