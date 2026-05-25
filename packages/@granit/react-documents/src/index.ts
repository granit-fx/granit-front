// Provider
export {
  buildDocumentsQueryKey,
  DocumentsProvider,
  useDocumentsConfig,
} from './providers/documents-provider.js';
export type {
  DocumentsConfig,
  DocumentsProviderProps,
  ResolvedDocumentsConfig,
} from './providers/documents-provider.js';

// Constants
export { API_VERSION, DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX, MODULE } from './constants.js';

// Read hooks — Folders
export { useFolder, useFolderBreadcrumb, useFolders } from './hooks/use-folders.js';

// Mutation hooks — Folders
export {
  useCreateFolder,
  useMoveFolder,
  useRenameFolder,
  useRestoreFolder,
  useTrashFolder,
} from './hooks/use-folder-mutations.js';

// Read hooks — Documents
export {
  useDocument,
  useDocumentDownloadUrl,
  useDocumentVersions,
  useTrashedDocuments,
} from './hooks/use-documents.js';

// Mutation hooks — Documents
export {
  useAppendDocumentVersion,
  useFinalizeUpload,
  useMoveDocument,
  usePermanentlyDeleteDocument,
  useRenameDocument,
  useRequestUploadTicket,
  useRestoreDocument,
  useTrashDocument,
} from './hooks/use-document-mutations.js';

// Read hooks — Shares
export { useDocumentShares, useFolderShares } from './hooks/use-shares.js';

// Mutation hooks — Shares
export {
  useGrantDocumentShare,
  useGrantFolderShare,
  useRevokeShare,
} from './hooks/use-share-mutations.js';

// Document tags (Documents-proxy over Granit.Taxonomy)
export {
  useAssignDocumentTag,
  useDocumentTagsList,
  useUnassignDocumentTag,
} from './hooks/use-document-tags.js';

// Quota
export { useTenantStorageQuota } from './hooks/use-quota.js';

// Components — Documents
export { DocumentDetail } from './components/document-detail.js';
export type { DocumentDetailLabels, DocumentDetailProps } from './components/document-detail.js';

export { DocumentsExplorer } from './components/documents-explorer.js';
export type {
  DocumentsExplorerLabels,
  DocumentsExplorerProps,
} from './components/documents-explorer.js';

export { DocumentsList } from './components/documents-list.js';
export type { DocumentsListLabels, DocumentsListProps } from './components/documents-list.js';

export { DocumentsToolbar } from './components/documents-toolbar.js';
export type {
  DocumentsToolbarLabels,
  DocumentsToolbarProps,
} from './components/documents-toolbar.js';

export { InlineEdit } from './components/inline-edit.js';
export type { InlineEditProps } from './components/inline-edit.js';

export { useMultiSelect } from './hooks/use-multi-select.js';
export type { MultiSelectApi } from './hooks/use-multi-select.js';

// Components — Folders
export { FolderBreadcrumb } from './components/folder-breadcrumb.js';
export type {
  FolderBreadcrumbLabels,
  FolderBreadcrumbProps,
} from './components/folder-breadcrumb.js';

export { FolderTree } from './components/folder-tree.js';
export type { FolderTreeLabels, FolderTreeProps } from './components/folder-tree.js';

// Components — Quota
export { QuotaBadge } from './components/quota-badge.js';
export type { QuotaBadgeLabels, QuotaBadgeProps } from './components/quota-badge.js';

export { QuotaPanel } from './components/quota-panel.js';
export type { QuotaPanelLabels, QuotaPanelProps } from './components/quota-panel.js';

// Components — Shares
export { ShareDialog } from './components/share-dialog.js';
export type {
  ShareDialogLabels,
  ShareDialogProps,
  ShareDialogTarget,
} from './components/share-dialog.js';

// Components — Trash
export { TrashBin } from './components/trash-bin.js';
export type { TrashBinLabels, TrashBinProps } from './components/trash-bin.js';

// Components — Upload
export { UploadButton } from './components/upload-button.js';
export type { UploadButtonLabels, UploadButtonProps } from './components/upload-button.js';

// Components — Versions
export { VersionsTimeline } from './components/versions-timeline.js';
export type {
  VersionsTimelineLabels,
  VersionsTimelineProps,
} from './components/versions-timeline.js';

// Helpers
export { formatBytes } from './components/format-bytes.js';

// i18n
export { documentsTranslationsEn, documentsTranslationsFr } from './locales/index.js';
export type { DocumentsTranslations } from './locales/index.js';
