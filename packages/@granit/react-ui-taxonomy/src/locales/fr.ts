/**
 * French admin strings for the Taxonomy UI — flat `taxonomy:*` keys mirroring
 * {@link taxonomyAdminTranslationsEn}. Wording follows the headless
 * `@granit/react-taxonomy`'s French bundle, adapted where the admin pages
 * render their own (longer) `defaultValue`.
 */
export const taxonomyAdminTranslationsFr = {
  'taxonomy:Category.Tree.Add': 'Ajouter une sous-catégorie',
  'taxonomy:Category.Tree.AddDialogTitle': 'Ajouter une catégorie',
  'taxonomy:Category.Tree.Cancel': 'Annuler',
  'taxonomy:Category.Tree.Collapse': 'Réduire',
  'taxonomy:Category.Tree.ConfirmDelete': 'Supprimer',
  'taxonomy:Category.Tree.Delete': 'Supprimer',
  'taxonomy:Category.Tree.DeleteConfirm':
    'Supprimer cette catégorie ? Cette action est irréversible. Une catégorie ayant des sous-catégories ou des affectations actives ne peut pas être supprimée.',
  'taxonomy:Category.Tree.Empty': 'Aucune catégorie.',
  'taxonomy:Category.Tree.Expand': 'Développer',
  'taxonomy:Category.Tree.Error.CrossScope':
    'Impossible de déplacer la catégorie entre périmètres.',
  'taxonomy:Category.Tree.Error.Cycle':
    'Impossible de déplacer une catégorie sous l’un de ses propres descendants.',
  'taxonomy:Category.Tree.Error.HasAssignments':
    'Suppression impossible : cette catégorie a des affectations actives.',
  'taxonomy:Category.Tree.Error.HasDescendants':
    'Suppression impossible : cette catégorie a des sous-catégories.',
  'taxonomy:Category.Tree.Loading': 'Chargement…',
  'taxonomy:Category.Tree.Move': 'Déplacer',
  'taxonomy:Category.Tree.MoveDialogTitle': 'Déplacer la catégorie',
  'taxonomy:Category.Tree.MovePromote': '(promouvoir à la racine)',
  'taxonomy:Category.Tree.MovePrompt':
    'Collez l’identifiant de la nouvelle catégorie parente, ou laissez vide pour promouvoir à la racine.',
  'taxonomy:Category.Tree.NameField': 'Nom',
  'taxonomy:Category.Tree.NewParentField': 'Identifiant de la nouvelle catégorie parente',
  'taxonomy:Category.Tree.Rename': 'Renommer',
  'taxonomy:Category.Tree.RenameDialogTitle': 'Renommer la catégorie',
  'taxonomy:Category.Tree.Submit': 'Enregistrer',
  'taxonomy:Category.Tree.Subtitle':
    'Les catégories sont des conteneurs hiérarchiques à affectation unique. Chaque entité appartient à au plus une catégorie dans un périmètre donné.',
  'taxonomy:Category.Tree.Title': 'Catégories',
  'taxonomy:Search.BelowThreshold': 'Saisissez au moins 2 caractères',
  'taxonomy:Search.Empty': 'Aucun résultat.',
  'taxonomy:Search.Error': 'Échec de la recherche.',
  'taxonomy:Search.Loading': 'Recherche…',
  'taxonomy:Search.Placeholder': 'Rechercher par étiquette ou catégorie…',
  'taxonomy:Search.TargetType.Document': 'Documents',
  'taxonomy:Search.TargetType.Party': 'Tiers',
  'taxonomy:Tag.Manager.ActionsHeader': 'Actions',
  'taxonomy:Tag.Manager.Cancel': 'Annuler',
  'taxonomy:Tag.Manager.ColorHeader': 'Couleur',
  'taxonomy:Tag.Manager.Create': 'Créer',
  'taxonomy:Tag.Manager.Delete': 'Supprimer',
  'taxonomy:Tag.Manager.DeleteConfirm':
    'Supprimer cette étiquette ? Toutes les affectations seront retirées.',
  'taxonomy:Tag.Manager.Empty': 'Aucune étiquette pour le moment — créez la première.',
  'taxonomy:Tag.Manager.HideHeader': 'Masquée sur les fiches',
  'taxonomy:Tag.Manager.HideTooltip':
    'Masque cette étiquette sur les fiches d’entité tout en la conservant dans les vues d’administration.',
  'taxonomy:Tag.Manager.InvalidColor':
    'La couleur doit être un code hexadécimal à 7 caractères (par ex. #1A2B3C).',
  'taxonomy:Tag.Manager.NameConflict': 'Une étiquette portant ce nom existe déjà.',
  'taxonomy:Tag.Manager.NameHeader': 'Nom',
  'taxonomy:Tag.Manager.NameRequired': 'Le nom est obligatoire.',
  'taxonomy:Tag.Manager.NameTooLong': 'Le nom ne doit pas dépasser 50 caractères.',
  'taxonomy:Tag.Manager.NewTag': 'Nouvelle étiquette',
  'taxonomy:Tag.Manager.ReadonlyHint': 'Vous n’avez pas la permission de gérer les étiquettes.',
  'taxonomy:Tag.Manager.Subtitle':
    'Les étiquettes sont des libellés réutilisables, plusieurs-à-plusieurs, rattachés à un seul module.',
  'taxonomy:Tag.Manager.Title': 'Étiquettes',
} as const;
