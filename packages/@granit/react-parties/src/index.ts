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

// Components
export { MergeWizard } from './components/MergeWizard.js';
export type { MergeWizardProps } from './components/MergeWizard.js';

// i18n bundles
export { partiesTranslationsEn, partiesTranslationsFr } from './locales/index.js';
