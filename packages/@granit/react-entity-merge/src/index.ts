// Provider
export {
  EntityMergeProvider,
  buildEntityMergeQueryKey,
  useEntityMergeConfig,
} from './providers/entity-merge-provider.js';
export type {
  EntityMergeConfig,
  ResolvedEntityMergeConfig,
  EntityMergeProviderProps,
} from './providers/entity-merge-provider.js';

// Constants
export { API_VERSION, DEFAULT_QUERY_KEY_PREFIX } from './constants.js';

// Hooks
export { entityMergeKeys } from './hooks/query-keys.js';
export { useMergePreview } from './hooks/use-merge-preview.js';
export type { UseMergePreviewOptions } from './hooks/use-merge-preview.js';
export { useMergeMutation } from './hooks/use-merge-mutation.js';
export type { MergeMutationVariables } from './hooks/use-merge-mutation.js';
export { useFieldChoices } from './hooks/use-field-choices.js';
export type { UseFieldChoicesResult } from './hooks/use-field-choices.js';

// Components
export { FieldConflictTable } from './components/field-conflict-table.js';
export type {
  FieldConflictTableProps,
  FieldConflictTableLabels,
} from './components/field-conflict-table.js';
export { ReferenceRewriterSummary } from './components/reference-rewriter-summary.js';
export type {
  ReferenceRewriterSummaryProps,
  ReferenceRewriterSummaryLabels,
} from './components/reference-rewriter-summary.js';
export { MergeConfirmDialog } from './components/merge-confirm-dialog.js';
export type {
  MergeConfirmDialogProps,
  MergeConfirmDialogLabels,
} from './components/merge-confirm-dialog.js';
export { MergeWizard } from './components/merge-wizard.js';
export type { MergeWizardProps, MergeWizardLabels } from './components/merge-wizard.js';

// i18n label bags (convenience defaults)
export { entityMergeTranslationsEn, entityMergeTranslationsFr } from './locales/index.js';
