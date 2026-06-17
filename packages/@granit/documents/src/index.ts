// Types
export type {
  AppendVersionRequest,
  BatchResolveRequest,
  CreateFolderRequest,
  CreatePublicLinkRequest,
  CreatePublicLinkResponse,
  DocumentPropertiesResponse,
  DocumentPropertiesStatus,
  DocumentResponse,
  DocumentStatus,
  DocumentTagAssignmentResponse,
  DocumentTagResponse,
  DocumentVersionResponse,
  DownloadUrlResponse,
  EffectivePermissionLevel,
  FinalizeUploadRequest,
  FolderBreadcrumbResponse,
  FolderResponse,
  FolderStatus,
  GrantShareRequest,
  ListDocumentTagsResponse,
  ListDocumentVersionsResponse,
  ListFoldersFilter,
  ListFoldersResponse,
  ListRenditionsResponse,
  ListSharesResponse,
  ListTrashedDocumentsResponse,
  MoveDocumentRequest,
  MoveFolderRequest,
  PageFilter,
  PublicLinkResponse,
  PublicLinkScope,
  RenameDocumentRequest,
  RenameFolderRequest,
  RenditionDownloadUrlResponse,
  RenditionResponse,
  RenditionStatus,
  RenditionType,
  ResolveItemRequest,
  ResolvedDocumentResponse,
  RevokePublicLinkRequest,
  ShareGranteeType,
  SharePermissionLevel,
  ShareResponse,
  ShareTargetType,
  TenantStorageQuotaResponse,
  TransferOwnerRequest,
  TrashedDocumentResponse,
  UploadTicketRequest,
  UploadTicketResponse,
} from './types/index';

// Shared QueryEngine result type, re-exported so consumers of queryDocuments
// don't reach into @granit/query-engine directly.
export type { PagedResult } from '@granit/query-engine';

// Permissions
export { DocumentsPermissions } from './permissions';

// API — Folders
export {
  createFolder,
  getFolder,
  getFolderBreadcrumb,
  listFolders,
  moveFolder,
  renameFolder,
  restoreFolder,
  transferFolderOwner,
  trashFolder,
} from './api/folders-api';

// API — Documents
export {
  appendDocumentVersion,
  finalizeUpload,
  getDocument,
  listDocumentVersions,
  listTrashedDocuments,
  moveDocument,
  permanentlyDeleteDocument,
  queryDocuments,
  renameDocument,
  getDocumentDownloadUrl,
  requestUploadTicket,
  restoreDocument,
  transferDocumentOwner,
  trashDocument,
} from './api/documents-api';
export type { QueryDocumentsParams } from './api/documents-api';

// API — Shares
export {
  grantDocumentShare,
  grantFolderShare,
  listDocumentShares,
  listFolderShares,
  revokeShare,
} from './api/shares-api';

// API — Document tags (Taxonomy proxy)
export { assignDocumentTag, listDocumentTags, unassignDocumentTag } from './api/tags-api';

// API — Quota
export { getTenantStorageQuota } from './api/quota-api';

// API — Document properties
export { getDocumentProperties, getDocumentVersionProperties } from './api/properties-api';

// API — Public links
export {
  createDocumentPublicLink,
  listDocumentPublicLinks,
  revokeDocumentPublicLink,
} from './api/public-links-api';

// API — Renditions
export { listDocumentRenditions, getRenditionDownloadUrl } from './api/renditions-api';

// API — Resolution
export { batchResolveDocumentAssets } from './api/resolution-api';
