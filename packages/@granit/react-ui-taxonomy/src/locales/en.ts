/**
 * English admin strings for the Taxonomy UI. Flat `taxonomy:*` keys looked up
 * verbatim by the admin pages (the host registers them in the `translation`
 * namespace with separators disabled). Named `taxonomyAdminTranslationsEn` to
 * avoid colliding with the headless `@granit/react-taxonomy`'s nested
 * `taxonomyTranslationsEn` (registered under the `taxonomy` namespace).
 *
 * Values mirror the inline `defaultValue` each page renders.
 */
export const taxonomyAdminTranslationsEn = {
  'taxonomy:Category.Tree.Add': 'Add child',
  'taxonomy:Category.Tree.AddDialogTitle': 'Add category',
  'taxonomy:Category.Tree.Cancel': 'Cancel',
  'taxonomy:Category.Tree.Collapse': 'Collapse',
  'taxonomy:Category.Tree.ConfirmDelete': 'Delete',
  'taxonomy:Category.Tree.Delete': 'Delete',
  'taxonomy:Category.Tree.DeleteConfirm':
    'Delete this category? This cannot be undone. Categories with descendants or active assignments cannot be deleted.',
  'taxonomy:Category.Tree.Empty': 'No categories.',
  'taxonomy:Category.Tree.Expand': 'Expand',
  'taxonomy:Category.Tree.Error.CrossScope': 'Cannot move across scopes.',
  'taxonomy:Category.Tree.Error.Cycle': 'Cannot move a category under one of its descendants.',
  'taxonomy:Category.Tree.Error.HasAssignments':
    'Cannot delete: this category has active assignments.',
  'taxonomy:Category.Tree.Error.HasDescendants': 'Cannot delete: this category has descendants.',
  'taxonomy:Category.Tree.Loading': 'Loading…',
  'taxonomy:Category.Tree.Move': 'Move',
  'taxonomy:Category.Tree.MoveDialogTitle': 'Move category',
  'taxonomy:Category.Tree.MovePromote': '(promote to root)',
  'taxonomy:Category.Tree.MovePrompt':
    'Paste the new parent category id, or leave empty to promote to root.',
  'taxonomy:Category.Tree.NameField': 'Name',
  'taxonomy:Category.Tree.NewParentField': 'New parent category id',
  'taxonomy:Category.Tree.Rename': 'Rename',
  'taxonomy:Category.Tree.RenameDialogTitle': 'Rename category',
  'taxonomy:Category.Tree.Submit': 'Save',
  'taxonomy:Category.Tree.Subtitle':
    'Categories are single-assignment, hierarchical buckets. Each entity belongs to at most one category in a given scope.',
  'taxonomy:Category.Tree.Title': 'Categories',
  'taxonomy:Search.BelowThreshold': 'Type at least 2 characters',
  'taxonomy:Search.Empty': 'No results.',
  'taxonomy:Search.Error': 'Search failed.',
  'taxonomy:Search.Loading': 'Searching…',
  'taxonomy:Search.Placeholder': 'Search by tag or category…',
  'taxonomy:Search.TargetType.Document': 'Documents',
  'taxonomy:Search.TargetType.Party': 'Parties',
  'taxonomy:Tag.Manager.ActionsHeader': 'Actions',
  'taxonomy:Tag.Manager.Cancel': 'Cancel',
  'taxonomy:Tag.Manager.ColorHeader': 'Color',
  'taxonomy:Tag.Manager.Create': 'Create',
  'taxonomy:Tag.Manager.Delete': 'Delete',
  'taxonomy:Tag.Manager.DeleteConfirm': 'Delete this tag? All assignments will be removed.',
  'taxonomy:Tag.Manager.Empty': 'No tags yet — create the first one.',
  'taxonomy:Tag.Manager.HideHeader': 'Hidden on cards',
  'taxonomy:Tag.Manager.HideTooltip':
    'Hide this tag from entity cards while keeping it in admin views.',
  'taxonomy:Tag.Manager.InvalidColor': 'Color must be a 7-character hex (e.g. #1A2B3C).',
  'taxonomy:Tag.Manager.NameConflict': 'A tag with this name already exists.',
  'taxonomy:Tag.Manager.NameHeader': 'Name',
  'taxonomy:Tag.Manager.NameRequired': 'Name is required.',
  'taxonomy:Tag.Manager.NameTooLong': 'Name must be at most 50 characters.',
  'taxonomy:Tag.Manager.NewTag': 'New tag',
  'taxonomy:Tag.Manager.ReadonlyHint': "You don't have permission to manage tags.",
  'taxonomy:Tag.Manager.Subtitle':
    'Tags are reusable, many-to-many labels scoped to a single module.',
  'taxonomy:Tag.Manager.Title': 'Tags',
} as const;
