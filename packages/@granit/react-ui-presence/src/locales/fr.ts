// @granit/react-ui-presence — French resource bundle (flat keys, "translation" ns).

export const presenceTranslationsFr = {
  'Presence.HeartbeatCadence':
    'Heartbeat toutes les 30 s · hors ligne après {{seconds}}s sans poll',
  'Presence.LastSeen': 'Vu pour la dernière fois : {{when}}',
  'Presence.LastSeenUnknown': 'Vu pour la dernière fois : —',
  'Presence.LoadFailed': 'Échec du chargement : {{error}}',
  'Presence.Loading': 'Chargement…',
  'Presence.OverrideLabel': '(surcharge : {{status}})',
  'Presence.RoomEmpty': "Aucun participant dans cette salle pour l'instant.",
  'Presence.RoomError': 'Erreur de salle : {{error}}',
  'Presence.RoomJoining': 'Connexion à la salle…',
  'Presence.RoomLastSeen': 'Vu à {{when}}',
  'Presence.RoomSelf': 'Vous',
  'Presence.RoomTitle': 'Salle ressource (useResourcePresence)',
  'Presence.SetStatus': 'Définir votre statut',
  'Presence.Subtitle':
    "Démo live de @granit/react-presence : heartbeat, sélecteur d'override manuel, bandeau DnD, lookup en lot. Servie par les handlers MSW du showcase.",
  'Presence.TeamEmpty': "Aucun membre d'équipe à afficher.",
  'Presence.TeamLoading': "Chargement de l'équipe…",
  'Presence.TeamPresence': "Présence de l'équipe (lookup en lot)",
  'Presence.Title': 'Démo Présence',
  'Presence.YourPresence': 'Votre présence',
} as const;
