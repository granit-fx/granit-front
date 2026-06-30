// Types
export type {
  AddressKind,
  CreatePartyOptions,
  DuplicateMatchSignalResponse,
  DuplicateMatchTier,
  EvidenceBlobId,
  FieldConflictResponse,
  MergeWinner,
  PartyAddressConfirmRequest,
  PartyAddressId,
  PartyAddressRequest,
  PartyAddressResponse,
  PartyCreateConflictResponse,
  PartyCreateDuplicateCandidate,
  PartyCreateRequest,
  PartyDuplicateCandidateId,
  PartyDuplicateCandidateResponse,
  PartyDuplicateMergeRequest,
  PartyEmailId,
  PartyEmailRequest,
  PartyEmailResponse,
  PartyExternalMappingId,
  PartyExternalMappingRequest,
  PartyExternalMappingResponse,
  PartyId,
  PartyKind,
  PartyListItemResponse,
  PartyMergeRequest,
  PartyMergeResponse,
  PartyMetadataRequest,
  PartyPhoneId,
  PartyPhoneRequest,
  PartyPhoneResponse,
  PartyResponse,
  PartyRole,
  PartyRoleRequest,
  PartyStatus,
  PartySuspendRequest,
  PartyTaxStatusRequest,
  PartyTaxStatusResponse,
  PartyUpdateRequest,
  PhoneKind,
} from './types/index';

// Permissions
export { PartiesPermissions } from './permissions';

// API — core
export {
  activateParty,
  addPartyAddress,
  addPartyEmail,
  addPartyExternalMapping,
  addPartyPhone,
  addPartyRole,
  archiveParty,
  clearPartyTaxStatus,
  confirmPartyAddress,
  createParty,
  downloadPartyVCard,
  getPartyById,
  listParties,
  mergeParty,
  previewPartyMerge,
  removePartyAddress,
  removePartyEmail,
  removePartyExternalMapping,
  removePartyPhone,
  removePartyRole,
  replacePartyMetadata,
  setPartyTaxStatus,
  suspendParty,
  updateParty,
} from './api/parties-api';

// API — duplicate detection
export {
  dismissPartyDuplicate,
  listDuplicatesForParty,
  mergePartyFromDuplicate,
} from './api/parties-duplicates-api';

// Validation constraints (generated from contracts/openapi/parties.json)
export { partiesConstraints } from './constraints';
