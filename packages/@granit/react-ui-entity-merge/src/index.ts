// @granit/react-ui-entity-merge — the react-ui-styled rendering layer for the
// generic entity-merge flow. Composes the headless @granit/react-entity-merge
// (provider, hooks, MergeConfirmDialog, ReferenceRewriterSummary) with the
// foundation @granit/react-ui components (Alert). Owns no DTOs, HTTP calls, or
// query keys — those live in @granit/entity-merge / @granit/react-entity-merge.

export { FieldConflictTable } from './components/field-conflict-table';
export type {
  FieldConflictTableProps,
  FieldConflictTableLabels,
} from './components/field-conflict-table';
export { MergeWizard } from './components/merge-wizard';
export type { MergeWizardProps, MergeWizardLabels } from './components/merge-wizard';

// i18n label bags (convenience defaults for the MergeWizard)
export { entityMergeTranslationsEn, entityMergeTranslationsFr } from './locales/index';
