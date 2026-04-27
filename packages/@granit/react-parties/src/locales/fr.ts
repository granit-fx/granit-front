/**
 * French translation bundle for the parties feature. Consumers register it
 * via `i18n.addResourceBundle('fr', 'parties', partiesTranslationsFr)` (or
 * via the `react-i18next` configuration).
 */
export const partiesTranslationsFr = {
  MergeWizard: {
    Title: 'Fusionner des tiers',
    Subtitle:
      'Résolvez les conflits et vérifiez les références qui seront réécrites avant de valider.',
    Survivor: 'Tiers conservé',
    Loser: 'Tiers absorbé',
    SurvivorHelp: 'Le tiers qui absorbera l’autre.',
    LoserHelp: 'Le tiers qui sera mis hors-service.',
    Conflicts: 'Conflits de champ',
    ConflictsEmpty: 'Aucun conflit — les valeurs sont identiques ou un seul côté est renseigné.',
    Rewrites: 'Ce qui sera réécrit',
    RewritesEmpty: 'Aucune référence inter-modules à réécrire.',
    RewritesRowCount_one: '{{count}} ligne',
    RewritesRowCount_other: '{{count}} lignes',
    Reason: 'Raison',
    ReasonHelp: 'Justification administrative optionnelle — enregistrée dans le journal d’audit.',
    ReasonPlaceholder: 'ex. Doublon créé par sync ERP.',
    Cancel: 'Annuler',
    Merge: 'Fusionner',
    Loading: 'Calcul de l’aperçu…',
    Errors: {
      PreviewFailed: 'Impossible de calculer l’aperçu de fusion.',
      MergeFailed: 'Échec de la fusion.',
      DomainConflict: 'La fusion ne peut pas aboutir : {{message}}',
      AlreadyMerged:
        'Cette paire est déjà fusionnée ou un autre administrateur vient de terminer l’opération. Rafraîchissez et réessayez.',
      Unknown: 'Une erreur inattendue s’est produite.',
    },
    Fields: {
      Name: 'Nom',
      Website: 'Site web',
      Language: 'Langue',
      Timezone: 'Fuseau horaire',
      TaxId: 'Identifiant fiscal',
      RegistrationNumber: 'Numéro d’enregistrement',
      TaxStatus: 'Statut fiscal',
      InternalNotes: 'Notes internes',
    },
    Rewriters: {
      'Invoice.PartyId': 'Factures',
      'Subscription.PartyId': 'Abonnements',
      'BalanceAccount.PartyId': 'Comptes de solde',
      'Payment.PartyId': 'Paiements',
      'Party.ParentContactId': 'Tiers enfants (parent ré-attaché)',
      'Party.Children': 'Enfants du tiers absorbé (ré-attachés au tiers conservé)',
    },
    ValueEmpty: '(vide)',
  },
  Duplicates: {
    Inbox: {
      Title: 'Doublons potentiels',
      Subtitle:
        'Examinez les paires détectées par le scan récurrent. Rejetez les faux positifs ou fusionnez les doublons confirmés.',
    },
    Columns: {
      Score: 'Score',
      Tier: 'Niveau',
      PartyA: 'Tiers A',
      PartyB: 'Tiers B',
      Detected: 'Détecté',
      Refreshed: 'Rafraîchi',
      Actions: 'Actions',
    },
    Tier: {
      Deterministic: 'Déterministe',
      Blocking: 'Bloquant',
      Fuzzy: 'Approximatif',
    },
    Actions: {
      Dismiss: 'Rejeter',
      Merge: 'Fusionner…',
      DismissedToast: 'Paire rejetée.',
      MergedToast: 'Tiers fusionnés.',
    },
    EmptyState: 'Aucun doublon en attente.',
    LoadingState: 'Chargement des doublons…',
    ErrorState: 'Impossible de charger les doublons.',
    Pagination: {
      Previous: 'Précédent',
      Next: 'Suivant',
      PageOfTotal: 'Page {{page}} sur {{total}}',
    },
    Badge: {
      PerParty_one: 'Doublon potentiel ({{count}})',
      PerParty_other: 'Doublons potentiels ({{count}})',
    },
  },
} as const;
