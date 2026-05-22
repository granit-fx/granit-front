/**
 * English translation bundle for `@granit/react-presence`.
 *
 * Consumers register the bundle with their i18n instance:
 *
 *   import { presenceTranslationsEn } from '@granit/react-presence';
 *   i18n.addResourceBundle('en', 'presence', presenceTranslationsEn);
 *
 * Components in this package don't call `useTranslation` directly —
 * they expose `labels` props that apps populate from `t()` results.
 */
export interface PresenceTranslations {
  readonly Status: Readonly<
    Record<'Online' | 'Away' | 'Busy' | 'DoNotDisturb' | 'Offline', string>
  >;
  readonly Manual: Readonly<
    Record<'Available' | 'Busy' | 'DoNotDisturb' | 'AppearOffline', string>
  >;
  readonly Picker: {
    readonly Title: string;
    readonly Until: string;
    readonly Save: string;
    readonly Clear: string;
    readonly CustomUntil: string;
    readonly NoOverride: string;
    readonly OverrideUntil: string;
    readonly InvalidUntil: string;
    readonly Presets: {
      readonly ThirtyMinutes: string;
      readonly OneHour: string;
      readonly FourHours: string;
      readonly Today: string;
      readonly Custom: string;
      readonly NoExpiry: string;
    };
  };
  readonly DndBanner: {
    readonly DoNotDisturb: string;
    readonly AppearOffline: string;
    readonly ClearAction: string;
  };
}

export const presenceTranslationsEn: PresenceTranslations = {
  Status: {
    Online: 'Online',
    Away: 'Away',
    Busy: 'Busy',
    DoNotDisturb: 'Do not disturb',
    Offline: 'Offline',
  },
  Manual: {
    Available: 'Available',
    Busy: 'Busy',
    DoNotDisturb: 'Do not disturb',
    AppearOffline: 'Appear offline',
  },
  Picker: {
    Title: 'Set status',
    Until: 'Clear after',
    Save: 'Set status',
    Clear: 'Clear status',
    CustomUntil: 'Pick a date and time',
    NoOverride: 'No active override',
    OverrideUntil: 'Until {{until}}',
    InvalidUntil: 'The expiry must be in the future and at most 7 days away.',
    Presets: {
      ThirtyMinutes: '30 minutes',
      OneHour: '1 hour',
      FourHours: '4 hours',
      Today: 'Today',
      Custom: 'Custom…',
      NoExpiry: "Don't clear",
    },
  },
  DndBanner: {
    DoNotDisturb:
      'You are in Do not disturb — real-time notifications (push, SignalR, SSE) are muted.',
    AppearOffline:
      'You appear offline — others see you as Offline and real-time notifications are muted.',
    ClearAction: 'Clear status',
  },
};
