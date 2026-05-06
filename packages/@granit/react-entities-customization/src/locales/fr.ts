import type { CustomizationTranslations } from './en.js';

/**
 * French translation bundle for `@granit/react-entities-customization`.
 *
 *   i18n.addResourceBundle('fr', 'customization', customizationTranslationsFr);
 */
export const customizationTranslationsFr: CustomizationTranslations = {
  Editor: {
    MoveUp: 'Monter',
    MoveDown: 'Descendre',
    Hide: 'Masquer',
    Show: 'Afficher',
    NoGroup: '— aucun groupe —',
    GroupSelectAriaLabel: 'Groupe pour {{fieldName}}',
  },
  Inspector: {
    Title: 'Chaîne de résolution — {{fieldName}}',
    Close: 'Fermer',
    WinningTag: 'gagnant',
    Layers: {
      Layer1Admin: 'Admin du tenant (personnalisation)',
      Layer2Workspace: 'Espace de travail',
      Layer3Role: 'Rôle',
      Layer4User: 'Préférence utilisateur',
      Layer5Schema: 'Valeur par défaut du schéma',
    },
  },
};
