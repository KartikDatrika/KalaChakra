# KalaChakra — Jivan OS Lite (Sovereign Time Engine)

Ancient science to make Time Management spontaneous.

Local-first React Native (Expo) single-screen Kala Chakra dial. Five orbit zoom levels driven by right-edge pan gesture. SQLite stores Pomodoro interactions. Zero network.

## Setup

```bash
npm install
npx expo start
```

Open in Expo Go (iOS/Android) or simulator.

## Architecture

- `App.tsx` — boots SQLite, mounts `KalaChakra`.
- `src/db/` — `expo-sqlite` client + schema + queries.
- `src/gestures/useOrbitSlider.ts` — Reanimated `SharedValue<orbitLevel>` 0..4 + spring snap + haptic bump.
- `src/ui/KalaChakra.tsx` — composes 5 SVG orbit layers, cross-fades via `useAnimatedStyle`.
- `src/ui/orbits/` — Ahoratra (24h), Samvatsara (12 months + 6 ritus), Jivana (60 yrs), Divya (yuga pie), Brahma (dot cloud).
- `src/ui/PomodoroCore.tsx` — tap-center starts 25min focus; on complete INSERTs interaction.
- `src/time/` — guna / ritu / yuga utilities.

## Interactions

- Pan up/down on right 60px strip → switch orbit (snaps to nearest of 0..4).
- Tap dial center at Level 0 → start/stop Pomodoro.
- Heat-map fills Level 1 months + Level 2 years from historical Rajas focus minutes.

## Constraints honored

- 100% local, no network, no cloud.
- Gesture math on UI thread (Reanimated worklets).
- No nav bars, no headers — pure dial.
