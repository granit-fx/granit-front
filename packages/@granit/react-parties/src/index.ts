// Provider
export {
  PartiesProvider,
  buildPartiesQueryKey,
  usePartiesConfig,
} from './providers/parties-provider';
export type { PartiesConfig, PartiesProviderProps } from './providers/parties-provider';
export { PartiesListProvider } from './providers/parties-list-provider';
export type { PartiesListProviderProps } from './providers/parties-list-provider';

// Hooks — CRUD + lifecycle + sub-collections + tax status + metadata
export {
  useActivatePartyMutation,
  useAddPartyAddressMutation,
  useAddPartyEmailMutation,
  useAddPartyExternalMappingMutation,
  useAddPartyPhoneMutation,
  useAddPartyRoleMutation,
  useArchivePartyMutation,
  useClearPartyTaxStatusMutation,
  useConfirmPartyAddressMutation,
  useCreatePartyMutation,
  useDownloadPartyVCard,
  usePartiesQuery,
  usePartyQuery,
  useRemovePartyAddressMutation,
  useRemovePartyEmailMutation,
  useRemovePartyExternalMappingMutation,
  useRemovePartyPhoneMutation,
  useRemovePartyRoleMutation,
  useReplacePartyMetadataMutation,
  useSetPartyTaxStatusMutation,
  useSuspendPartyMutation,
  useUpdatePartyMutation,
} from './hooks/use-parties';

// Hook — parties list (query-engine grid)
export { usePartiesListQuery } from './hooks/use-parties-list';

// Hooks — merge
export { useMergePartyMutation, useMergePartyPreviewQuery } from './hooks/use-party-merge';
export type { MergePartyMutationVariables } from './hooks/use-party-merge';
export type { CreatePartyMutationVariables } from './hooks/use-parties';

// Hooks — duplicate detection
export {
  useDismissPartyDuplicateMutation,
  useMergePartyFromDuplicateMutation,
  usePartyDuplicateCandidatesForPartyQuery,
} from './hooks/use-party-duplicates';
export type { MergePartyFromDuplicateMutationVariables } from './hooks/use-party-duplicates';

// i18n bundles
export { partiesTranslationsEn, partiesTranslationsFr } from './locales/index';

// HTTP error helper — re-exported so the UI tier narrows errors without
// depending on @granit/api-client directly (layer boundary: UI → headless).
export { isAxiosError } from '@granit/api-client';
