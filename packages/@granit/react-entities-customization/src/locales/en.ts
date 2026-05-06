export interface CustomizationTranslations {
  readonly Editor: {
    readonly MoveUp: string;
    readonly MoveDown: string;
    readonly Hide: string;
    readonly Show: string;
    readonly NoGroup: string;
    readonly GroupSelectAriaLabel: string;
  };
  readonly Inspector: {
    readonly Title: string;
    readonly Close: string;
    readonly WinningTag: string;
    readonly Layers: {
      readonly Layer1Admin: string;
      readonly Layer2Workspace: string;
      readonly Layer3Role: string;
      readonly Layer4User: string;
      readonly Layer5Schema: string;
    };
  };
}

/**
 * English translation bundle for `@granit/react-entities-customization`.
 *
 *   i18n.addResourceBundle('en', 'customization', customizationTranslationsEn);
 *
 * Components don't call `useTranslation` — apps populate the
 * `labels` props from `t()` results to keep the package headless and
 * testable without an i18next bootstrap.
 */
export const customizationTranslationsEn: CustomizationTranslations = {
  Editor: {
    MoveUp: 'Move up',
    MoveDown: 'Move down',
    Hide: 'Hide',
    Show: 'Show',
    NoGroup: '— no group —',
    GroupSelectAriaLabel: 'Group for {{fieldName}}',
  },
  Inspector: {
    Title: 'Resolution chain — {{fieldName}}',
    Close: 'Close',
    WinningTag: 'winning',
    Layers: {
      Layer1Admin: 'Tenant admin (customization)',
      Layer2Workspace: 'Workspace',
      Layer3Role: 'Role',
      Layer4User: 'User preference',
      Layer5Schema: 'Schema default',
    },
  },
};
