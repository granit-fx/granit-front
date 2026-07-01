// Provider
export {
  EntityMergeProvider,
  buildEntityMergeQueryKey,
  useEntityMergeConfig,
} from './providers/entity-merge-provider';
export type {
  EntityMergeConfig,
  ResolvedEntityMergeConfig,
  EntityMergeProviderProps,
} from './providers/entity-merge-provider';

// Constants
export { API_VERSION, DEFAULT_QUERY_KEY_PREFIX } from './constants';

// Hooks
export { entityMergeKeys } from './hooks/query-keys';
export { useMergePreview } from './hooks/use-merge-preview';
export type { UseMergePreviewOptions } from './hooks/use-merge-preview';
export { useMergeMutation } from './hooks/use-merge-mutation';
export type { MergeMutationVariables } from './hooks/use-merge-mutation';
export { useFieldChoices } from './hooks/use-field-choices';
export type { UseFieldChoicesResult } from './hooks/use-field-choices';

// Components (headless — the react-ui-styled FieldConflictTable and MergeWizard
// live in @granit/react-ui-entity-merge)
export { ReferenceRewriterSummary } from './components/reference-rewriter-summary';
export type {
  ReferenceRewriterSummaryProps,
  ReferenceRewriterSummaryLabels,
} from './components/reference-rewriter-summary';
export { MergeConfirmDialog } from './components/merge-confirm-dialog';
export type {
  MergeConfirmDialogProps,
  MergeConfirmDialogLabels,
} from './components/merge-confirm-dialog';
