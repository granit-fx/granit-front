// Provider
export {
  PartiesProvider,
  buildPartiesQueryKey,
  usePartiesConfig,
} from './providers/parties-provider';
export type { PartiesConfig, PartiesProviderProps } from './providers/parties-provider';

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
  useCreatePartyMutation,
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

// Components
export { MergeWizard } from './components/merge-wizard';
export type { MergeWizardProps } from './components/merge-wizard';
export { DuplicatesInbox } from './components/duplicates-inbox';
export type { DuplicatesInboxProps } from './components/duplicates-inbox';
export { PartyDuplicatesBadge } from './components/party-duplicates-badge';
export type { PartyDuplicatesBadgeProps } from './components/party-duplicates-badge';

// i18n bundles
export { partiesTranslationsEn, partiesTranslationsFr } from './locales/index';

// HTTP error helper — re-exported so the UI tier narrows errors without
// depending on @granit/api-client directly (layer boundary: UI → headless).
export { isAxiosError } from '@granit/api-client';
