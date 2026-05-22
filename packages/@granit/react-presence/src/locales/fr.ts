import type { PresenceTranslations } from './en.js';

export const presenceTranslationsFr: PresenceTranslations = {
  Status: {
    Online: 'En ligne',
    Away: 'Absent',
    Busy: 'Occupé',
    DoNotDisturb: 'Ne pas déranger',
    Offline: 'Hors ligne',
  },
  Manual: {
    Available: 'Disponible',
    Busy: 'Occupé',
    DoNotDisturb: 'Ne pas déranger',
    AppearOffline: 'Apparaître hors ligne',
  },
  Picker: {
    Title: 'Définir le statut',
    Until: 'Effacer après',
    Save: 'Définir le statut',
    Clear: 'Effacer le statut',
    CustomUntil: 'Choisir une date et une heure',
    NoOverride: 'Aucun statut manuel actif',
    OverrideUntil: "Jusqu'à {{until}}",
    InvalidUntil: "L'échéance doit être dans le futur et au plus 7 jours.",
    Presets: {
      ThirtyMinutes: '30 minutes',
      OneHour: '1 heure',
      FourHours: '4 heures',
      Today: "Aujourd'hui",
      Custom: 'Personnalisé…',
      NoExpiry: 'Ne pas effacer',
    },
  },
  DndBanner: {
    DoNotDisturb:
      'Vous êtes en Ne pas déranger — les notifications temps réel (push, SignalR, SSE) sont désactivées.',
    AppearOffline:
      'Vous apparaissez hors ligne — les autres vous voient hors ligne et les notifications temps réel sont désactivées.',
    ClearAction: 'Effacer le statut',
  },
};
