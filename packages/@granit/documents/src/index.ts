// Types
export type {
  AppendVersionRequest,
  CreateFolderRequest,
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
  ListSharesResponse,
  ListTrashedDocumentsResponse,
  MoveDocumentRequest,
  MoveFolderRequest,
  PageFilter,
  RenameDocumentRequest,
  RenameFolderRequest,
  ShareGranteeType,
  SharePermissionLevel,
  ShareResponse,
  ShareTargetType,
  TenantStorageQuotaResponse,
  TransferOwnerRequest,
  TrashedDocumentResponse,
  UploadTicketRequest,
  UploadTicketResponse,
} from './types/index.js';

// Permissions
export { DocumentsPermissions } from './permissions.js';

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
} from './api/folders-api.js';

// API — Documents
export {
  appendDocumentVersion,
  finalizeUpload,
  getDocument,
  listDocumentVersions,
  listTrashedDocuments,
  moveDocument,
  permanentlyDeleteDocument,
  renameDocument,
  requestDocumentDownloadUrl,
  requestUploadTicket,
  restoreDocument,
  transferDocumentOwner,
  trashDocument,
} from './api/documents-api.js';

// API — Shares
export {
  grantDocumentShare,
  grantFolderShare,
  listDocumentShares,
  listFolderShares,
  revokeShare,
} from './api/shares-api.js';

// API — Document tags (Taxonomy proxy)
export { assignDocumentTag, listDocumentTags, unassignDocumentTag } from './api/tags-api.js';

// API — Quota
export { getTenantStorageQuota } from './api/quota-api.js';
