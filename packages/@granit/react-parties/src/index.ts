// Provider
export {
  PartiesProvider,
  buildPartiesQueryKey,
  usePartiesConfig,
} from './providers/parties-provider.js';
export type { PartiesConfig, PartiesProviderProps } from './providers/parties-provider.js';

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
} from './hooks/use-parties.js';

// Hooks — merge
export { useMergePartyMutation, useMergePartyPreviewQuery } from './hooks/use-party-merge.js';
export type { MergePartyMutationVariables } from './hooks/use-party-merge.js';
export type { CreatePartyMutationVariables } from './hooks/use-parties.js';

// Hooks — duplicate detection
export {
  useDismissPartyDuplicateMutation,
  useMergePartyFromDuplicateMutation,
  usePartyDuplicateCandidatesForPartyQuery,
} from './hooks/use-party-duplicates.js';
export type { MergePartyFromDuplicateMutationVariables } from './hooks/use-party-duplicates.js';

// Components
export { MergeWizard } from './components/merge-wizard.js';
export type { MergeWizardProps } from './components/merge-wizard.js';
export { DuplicatesInbox } from './components/duplicates-inbox.js';
export type { DuplicatesInboxProps } from './components/duplicates-inbox.js';
export { PartyDuplicatesBadge } from './components/party-duplicates-badge.js';
export type { PartyDuplicatesBadgeProps } from './components/party-duplicates-badge.js';

// i18n bundles
export { partiesTranslationsEn, partiesTranslationsFr } from './locales/index.js';
