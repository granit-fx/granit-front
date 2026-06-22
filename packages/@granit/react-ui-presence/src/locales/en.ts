// @granit/react-ui-presence — i18next resource bundle (flat keys, "translation" ns).
// Register in the host app:
//   import { presenceTranslationsEn } from "@granit/react-ui-presence";
//   i18n.addResourceBundle("en", "translation", presenceTranslationsEn, true, true);

export const presenceTranslationsEn = {
  'Presence.HeartbeatCadence': 'Heartbeat every 30 s · offline after {{seconds}}s without poll',
  'Presence.LastSeen': 'Last seen: {{when}}',
  'Presence.LastSeenUnknown': 'Last seen: —',
  'Presence.LoadFailed': 'Failed to load: {{error}}',
  'Presence.Loading': 'Loading…',
  'Presence.OverrideLabel': '(override: {{status}})',
  'Presence.RoomEmpty': 'No participants in this room yet.',
  'Presence.RoomError': 'Room error: {{error}}',
  'Presence.RoomJoining': 'Joining room…',
  'Presence.RoomLastSeen': 'Last seen {{when}}',
  'Presence.RoomSelf': 'You',
  'Presence.RoomTitle': 'Resource room (useResourcePresence)',
  'Presence.SetStatus': 'Set your status',
  'Presence.Subtitle':
    'Live demo of @granit/react-presence: heartbeat, manual override picker, DnD banner, batch lookup. Backed by the showcase MSW handlers.',
  'Presence.TeamEmpty': 'No team members to show.',
  'Presence.TeamLoading': 'Loading team…',
  'Presence.TeamPresence': 'Team presence (batch lookup)',
  'Presence.Title': 'Presence demo',
  'Presence.YourPresence': 'Your presence',
} as const;

export type PresenceTranslations = typeof presenceTranslationsEn;
