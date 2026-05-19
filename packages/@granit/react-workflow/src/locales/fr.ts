import type { WorkflowTranslations } from './en.js';

/**
 * French translation bundle for `@granit/react-workflow`. Register via:
 *
 *   i18n.addResourceBundle('fr', 'workflow', workflowTranslationsFr);
 */
export const workflowTranslationsFr: WorkflowTranslations = {
  Transition: {
    DraftToPublished: {
      Title: 'Publier cet élément ?',
      Description:
        "La publication rend l'élément disponible pour les autres modules (Abonnements, Mesure, …). Vous pourrez l'archiver ensuite, mais pas revenir au statut Brouillon une fois publié.",
      Confirm: 'Publier',
    },
    DraftToPendingReview: {
      Title: 'Soumettre pour relecture ?',
      Description: 'L\'élément passe en "En relecture" et attend un approbateur.',
      Confirm: 'Soumettre',
    },
    PendingReviewToPublished: {
      Title: 'Approuver et publier ?',
      Description:
        "Approuve l'élément et le publie. Cette action ne peut pas être annulée vers le statut Brouillon.",
      Confirm: 'Approuver et publier',
    },
    PendingReviewToDraft: {
      Title: 'Renvoyer en Brouillon ?',
      Description: "Renvoie l'élément en Brouillon pour modification avant une nouvelle relecture.",
      Confirm: 'Renvoyer',
    },
    PublishedToArchived: {
      Title: 'Archiver cet élément ?',
      Description:
        "L'archivage retire l'élément de l'usage actif. Les références en aval (abonnements, lignes de facture, …) continuent de fonctionner, mais l'élément ne pourra plus être sélectionné pour de nouvelles opérations. Cette action est définitive — vous ne pourrez pas le restaurer.",
      Confirm: 'Archiver',
    },
    ArchivedToPublished: {
      Title: 'Restaurer cet élément ?',
      Description:
        "Restaure l'élément en statut Publié pour qu'il puisse être à nouveau sélectionné.",
      Confirm: 'Restaurer',
    },
    UnknownToUnknown: {
      Title: 'Confirmer cette transition ?',
      Description: 'Appliquer ce changement de cycle de vie ?',
      Confirm: 'Confirmer',
    },
  },
};
