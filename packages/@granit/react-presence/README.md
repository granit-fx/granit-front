# @granit/react-presence

React bindings for [`@granit/presence`](../presence/README.md): provider,
TanStack Query hooks, heartbeat scheduler, and headless UI components.

## Installation

```bash
pnpm add @granit/react-presence @granit/presence
```

## Surface

- `<PresenceProvider>` — wires the Axios client and base path.
- `<PresenceHeartbeat />` — mount once at the authenticated shell; polls
  `POST /presence/my/poll` every 30 s while the tab is visible.
- Hooks — `useMyPresence`, `useSetMyPresence`,
  `useClearMyPresenceOverride`, `useHeartbeat`, `useUserPresence`,
  `useBatchPresence`.
- Components — `<PresenceDot>`, `<PresencePicker>`, `<DndBanner>`.
- i18n bundles — `presenceTranslationsEn`, `presenceTranslationsFr`
  (namespace: `presence`).
- Testing helpers — `createPresenceHandlers` from
  `@granit/react-presence/testing`.

## Notification gate

When the current user is in `DoNotDisturb` or `AppearOffline`, the backend
[`Granit.Presence.Notifications`](https://granit-fx.dev) gate suppresses
push/SignalR/SSE delivery. Surface a passive reminder with `<DndBanner>`
so users understand why they no longer see toasts.
