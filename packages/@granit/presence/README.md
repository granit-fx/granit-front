# @granit/presence

User presence types and API client for the [Granit](https://granit-fx.dev)
framework. Mirrors the `Granit.Presence` .NET contract.

Exposes:

- Types — `PresenceStatus`, `ManualPresenceStatus`, `PresenceResponse`,
  `SetPresenceRequest`, `HeartbeatRequest`, `BatchPresenceRequest`,
  `BatchPresenceResponse`.
- API functions — `getMyPresence`, `setMyPresence`,
  `clearMyPresenceOverride`, `pollMyPresence`, `getUserPresence`,
  `getBatchPresence`.
- Permission constants — `PresencePermissions.Self.Manage`,
  `PresencePermissions.Users.Read`.
- Defaults — `PRESENCE_DEFAULTS`.

For React hooks, components, and a heartbeat scheduler, install
[`@granit/react-presence`](../react-presence/README.md).
