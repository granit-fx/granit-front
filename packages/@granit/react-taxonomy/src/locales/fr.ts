import type { TaxonomyTranslations } from './en.js';

export const taxonomyTranslationsFr: TaxonomyTranslations = {
  Tag: {
    Chip: {
      Remove: 'Retirer',
    },
    Strip: {
      Add: '+ Étiquette',
      Empty: 'Aucune étiquette.',
      Loading: 'Chargement…',
      Error: 'Échec du chargement des étiquettes.',
    },
    Autocomplete: {
      Placeholder: 'Ajouter une étiquette…',
      Empty: 'Aucune étiquette correspondante',
      Create: 'Créer',
    },
    Manager: {
      Title: 'Étiquettes',
      NewTag: 'Nouvelle étiquette',
      NameHeader: 'Nom',
      ColorHeader: 'Couleur',
      HideHeader: 'Masquée sur les fiches',
      ActionsHeader: 'Actions',
      HideTooltip:
        'Masque cette étiquette sur les fiches d’entité tout en la conservant dans les vues d’administration.',
      Delete: 'Supprimer',
      DeleteConfirm: 'Supprimer cette étiquette ? Toutes les affectations seront retirées.',
      InvalidColor: 'La couleur doit être un code hexadécimal à 7 caractères (par ex. #1A2B3C).',
      NameRequired: 'Le nom est obligatoire.',
      NameConflict: 'Une étiquette portant ce nom existe déjà.',
      Empty: 'Aucune étiquette pour le moment — créez la première.',
      ReadonlyHint: 'Vous n’avez pas la permission de gérer les étiquettes.',
      Create: 'Créer',
      Cancel: 'Annuler',
    },
  },
  Category: {
    Tree: {
      Add: '+',
      Rename: 'Renommer',
      Move: 'Déplacer',
      Delete: 'Supprimer',
      DeleteConfirm:
        'Supprimer cette catégorie ? Une catégorie ayant des sous-catégories ou des affectations actives ne peut pas être supprimée.',
      MoveDialogTitle: 'Déplacer la catégorie',
      MovePromote: '(promouvoir à la racine)',
      MovePrompt:
        'Collez l’identifiant de la nouvelle catégorie parente, ou laissez vide pour promouvoir à la racine.',
      Empty: 'Aucune catégorie.',
      Loading: 'Chargement…',
      Error422HasDescendants: 'Suppression impossible : cette catégorie a des sous-catégories.',
      Error422HasAssignments:
        'Suppression impossible : cette catégorie a des affectations actives.',
      Error422CrossScope: 'Impossible de déplacer la catégorie entre périmètres.',
      Error422Cycle: 'Impossible de déplacer une catégorie sous l’un de ses propres descendants.',
    },
    Selector: {
      NoCategory: 'Aucune catégorie',
      Choose: 'Choisir…',
      Clear: 'Effacer',
      Close: 'Fermer',
      DialogTitle: 'Choisir une catégorie',
    },
  },
  Search: {
    Placeholder: 'Rechercher…',
    BelowThreshold: 'Saisissez au moins 2 caractères',
    Empty: 'Aucun résultat.',
    Loading: 'Recherche…',
    Error: 'Échec de la recherche.',
  },
};
