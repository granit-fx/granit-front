import type { MergeWizardLabels } from '../components/merge-wizard.js';

/** Default French label bag for the generic {@link MergeWizard}. */
export const entityMergeTranslationsFr: MergeWizardLabels = {
  title: 'Fusionner des enregistrements',
  subtitle: 'Résolvez les conflits et vérifiez ce qui sera réattribué avant de valider.',
  conflictsHeading: 'Conflits de champs',
  rewritesHeading: 'Ce qui sera réattribué',
  reasonLabel: 'Motif',
  reasonHelp: "Justification facultative de l'administrateur — consignée dans le journal d'audit.",
  reasonPlaceholder: 'ex. Doublon créé par une intégration.',
  cancel: 'Annuler',
  merge: 'Fusionner',
  conflictTable: {
    survivor: 'Survivant',
    loser: 'Absorbé',
    empty: 'Aucun conflit de champ — les valeurs concordent ou un seul côté est renseigné.',
    loading: 'Calcul de l’aperçu…',
    error: 'Impossible de calculer l’aperçu de fusion.',
    valueEmpty: '(vide)',
  },
  rewriterSummary: {
    empty: 'Aucune référence inter-module à réattribuer.',
  },
  confirmDialog: {
    title: 'Confirmer la fusion',
    body: 'Cette fusion est irréversible — l’enregistrement absorbé est archivé (tombstone) et ses références sont rattachées au survivant.',
    confirm: 'Fusionner',
    cancel: 'Annuler',
  },
  errors: {
    conflict:
      'Cette paire est déjà fusionnée ou un autre administrateur vient de terminer l’opération. Actualisez et réessayez.',
    domain: 'La fusion ne peut pas aboutir :',
    notFound: 'Le survivant ou l’absorbé n’existe plus.',
    validation: 'La requête est invalide :',
    unknown: 'Une erreur inattendue est survenue.',
  },
};
