/**
 * English translation bundle for `@granit/react-taxonomy`. Consumers
 * register it via:
 *
 *   i18n.addResourceBundle('en', 'taxonomy', taxonomyTranslationsEn);
 *
 * Components in this package don't call `useTranslation` directly — they
 * expose `labels` props that apps populate from `t()`. This keeps the
 * components testable without i18next bootstrap, and keeps the framework
 * headless: apps own when and how to mount i18n.
 */
export const taxonomyTranslationsEn: TaxonomyTranslations = {
  Tag: {
    Chip: {
      Remove: 'Remove',
    },
    Strip: {
      Add: '+ Tag',
      Empty: 'No tags.',
      Loading: 'Loading…',
      Error: 'Failed to load tags.',
    },
    Autocomplete: {
      Placeholder: 'Add tag…',
      Empty: 'No matching tags',
      Create: 'Create',
    },
    Manager: {
      Title: 'Tags',
      NewTag: 'New tag',
      NameHeader: 'Name',
      ColorHeader: 'Color',
      HideHeader: 'Hidden on cards',
      ActionsHeader: 'Actions',
      HideTooltip: 'Hide this tag from entity cards while keeping it in admin views.',
      Delete: 'Delete',
      DeleteConfirm: 'Delete this tag? All assignments will be removed.',
      InvalidColor: 'Color must be a 7-character hex (e.g. #1A2B3C).',
      NameRequired: 'Name is required.',
      NameConflict: 'A tag with this name already exists.',
      Empty: 'No tags yet — create the first one.',
      ReadonlyHint: 'You don’t have permission to manage tags.',
      Create: 'Create',
      Cancel: 'Cancel',
    },
  },
  Category: {
    Tree: {
      Add: '+',
      Rename: 'Rename',
      Move: 'Move',
      Delete: 'Delete',
      DeleteConfirm:
        'Delete this category? Categories with descendants or active assignments cannot be deleted.',
      MoveDialogTitle: 'Move category',
      MovePromote: '(promote to root)',
      MovePrompt: 'Paste the new parent category id, or leave empty to promote to root.',
      Empty: 'No categories.',
      Loading: 'Loading…',
      Error422HasDescendants: 'Cannot delete: this category has descendants.',
      Error422HasAssignments: 'Cannot delete: this category has active assignments.',
      Error422CrossScope: 'Cannot move across scopes.',
      Error422Cycle: 'Cannot move a category under one of its descendants.',
    },
    Selector: {
      NoCategory: 'No category',
      Choose: 'Choose…',
      Clear: 'Clear',
      Close: 'Close',
      DialogTitle: 'Choose a category',
    },
  },
  Search: {
    Placeholder: 'Search…',
    BelowThreshold: 'Type at least 2 characters',
    Empty: 'No results.',
    Loading: 'Searching…',
    Error: 'Search failed.',
  },
};

export interface TaxonomyTranslations {
  readonly Tag: {
    readonly Chip: {
      readonly Remove: string;
    };
    readonly Strip: {
      readonly Add: string;
      readonly Empty: string;
      readonly Loading: string;
      readonly Error: string;
    };
    readonly Autocomplete: {
      readonly Placeholder: string;
      readonly Empty: string;
      readonly Create: string;
    };
    readonly Manager: {
      readonly Title: string;
      readonly NewTag: string;
      readonly NameHeader: string;
      readonly ColorHeader: string;
      readonly HideHeader: string;
      readonly ActionsHeader: string;
      readonly HideTooltip: string;
      readonly Delete: string;
      readonly DeleteConfirm: string;
      readonly InvalidColor: string;
      readonly NameRequired: string;
      readonly NameConflict: string;
      readonly Empty: string;
      readonly ReadonlyHint: string;
      readonly Create: string;
      readonly Cancel: string;
    };
  };
  readonly Category: {
    readonly Tree: {
      readonly Add: string;
      readonly Rename: string;
      readonly Move: string;
      readonly Delete: string;
      readonly DeleteConfirm: string;
      readonly MoveDialogTitle: string;
      readonly MovePromote: string;
      readonly MovePrompt: string;
      readonly Empty: string;
      readonly Loading: string;
      readonly Error422HasDescendants: string;
      readonly Error422HasAssignments: string;
      readonly Error422CrossScope: string;
      readonly Error422Cycle: string;
    };
    readonly Selector: {
      readonly NoCategory: string;
      readonly Choose: string;
      readonly Clear: string;
      readonly Close: string;
      readonly DialogTitle: string;
    };
  };
  readonly Search: {
    readonly Placeholder: string;
    readonly BelowThreshold: string;
    readonly Empty: string;
    readonly Loading: string;
    readonly Error: string;
  };
}
