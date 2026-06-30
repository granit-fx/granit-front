// Pages
export { PartiesListPage } from './components/parties-list-page';
export { PartyCreatePage } from './components/party-create-page';
export { PartyDetailPage } from './components/party-detail-page';
export { DuplicatesInboxPage } from './components/duplicates-inbox-page';

// Components — list / detail building blocks
export { createPartyColumns } from './components/party-columns';
export { PartyStatusBadge } from './components/party-status-badge';
export { PartyRolesBadges } from './components/party-roles-badges';
export { PartyCreateForm } from './components/party-create-form';
export { PartyIdentityForm } from './components/party-identity-form';
export { DownloadVCardButton } from './components/download-vcard-button';
export { LifecycleActions } from './components/lifecycle-actions';
export { MergeAction } from './components/merge-action';
export { MergeFromCandidate } from './components/merge-from-candidate';
export { MergeWizard } from './components/merge-wizard';
export type { MergeWizardProps } from './components/merge-wizard';
export { DuplicatesInbox } from './components/duplicates-inbox';
export type { DuplicatesInboxProps } from './components/duplicates-inbox';
export { PartyDuplicatesBadge } from './components/party-duplicates-badge';
export type { PartyDuplicatesBadgeProps } from './components/party-duplicates-badge';
export { CreateConflictDialog } from './components/create-conflict-dialog';
export { PartyPickerDialog } from './components/party-picker-dialog';

// Components — detail tabs
export { AddressesTab } from './components/addresses-tab';
export { EmailsTab } from './components/emails-tab';
export { PhonesTab } from './components/phones-tab';
export { ExternalMappingsTab } from './components/external-mappings-tab';
export { RolesTab } from './components/roles-tab';
export { MetadataTab } from './components/metadata-tab';
export { TaxStatusCard } from './components/tax-status-card';
export { EditTaxStatusDialog } from './components/edit-tax-status-dialog';

// Components — add-sub-resource dialogs
export { PartyAddDialog } from './components/party-add-dialog';
export type { PartyAddDialogProps } from './components/party-add-dialog';
export { AddAddressDialog } from './components/add-address-dialog';
export { AddEmailDialog } from './components/add-email-dialog';
export { AddPhoneDialog } from './components/add-phone-dialog';
export { AddExternalMappingDialog } from './components/add-external-mapping-dialog';
export { AddRoleDialog } from './components/add-role-dialog';

// Constants
export {
  ADDRESS_KINDS,
  PARTY_ASSIGNABLE_ROLES,
  PARTY_KINDS,
  PARTY_LIST_ROLE_FILTERS,
  PARTY_LIST_STATUS_FILTERS,
  PARTY_STATUSES,
  PHONE_KINDS,
  parsePartyRoleFlags,
} from './constants';
export type { PartyListRoleFilter, PartyListStatusFilter } from './constants';

// Validation — spec-driven resolver factories, form-value types, limits
export {
  createPartyAddressResolver,
  createPartyCreateResolver,
  createPartyEmailResolver,
  createPartyExternalMappingResolver,
  createPartyIdentityResolver,
  createPartyPhoneResolver,
  createPartyTaxStatusResolver,
  metadataLimits,
  partyLimits,
} from './validation';
export type {
  PartyAddressFormValues,
  PartyCreateFormValues,
  PartyEmailFormValues,
  PartyExternalMappingFormValues,
  PartyIdentityFormValues,
  PartyPhoneFormValues,
  PartyTaxStatusFormValues,
} from './validation';

// i18n bundles
export { partiesAdminTranslationsEn, partiesAdminTranslationsFr } from './locales';
