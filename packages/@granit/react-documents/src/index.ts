// Provider
export {
  buildDocumentsQueryKey,
  DocumentsProvider,
  useDocumentsConfig,
} from './providers/documents-provider';
export type {
  DocumentsConfig,
  DocumentsProviderProps,
  ResolvedDocumentsConfig,
} from './providers/documents-provider';

// Constants
export {
  API_VERSION,
  DEFAULT_BASE_PATH,
  DEFAULT_QUERY_KEY_PREFIX,
  DOCUMENT_DRAG_MIME,
  MODULE,
} from './constants';

// Read hooks — Folders
export { useFolder, useFolderBreadcrumb, useFolders } from './hooks/use-folders';

// Mutation hooks — Folders
export {
  useCreateFolder,
  useMoveFolder,
  useRenameFolder,
  useRestoreFolder,
  useTransferFolderOwner,
  useTrashFolder,
} from './hooks/use-folder-mutations';

// Read hooks — Documents
export {
  useDocument,
  useDocumentDownloadUrl,
  useDocumentVersions,
  useTrashedDocuments,
} from './hooks/use-documents';

// Mutation hooks — Documents
export {
  useAppendDocumentVersion,
  useFinalizeUpload,
  useMoveDocument,
  usePermanentlyDeleteDocument,
  useRenameDocument,
  useRequestUploadTicket,
  useRestoreDocument,
  useTransferDocumentOwner,
  useTrashDocument,
} from './hooks/use-document-mutations';

// Read hooks — Shares
export { useDocumentShares, useFolderShares } from './hooks/use-shares';

// Mutation hooks — Shares
export {
  useGrantDocumentShare,
  useGrantFolderShare,
  useRevokeShare,
} from './hooks/use-share-mutations';

// Document tags (Documents-proxy over Granit.Taxonomy)
export {
  useAssignDocumentTag,
  useDocumentTagsList,
  useUnassignDocumentTag,
} from './hooks/use-document-tags';

// Quota
export { useTenantStorageQuota } from './hooks/use-quota';

// Document properties
export {
  useDocumentProperties,
  useDocumentVersionProperties,
} from './hooks/use-document-properties';

// Public links
export {
  useCreateDocumentPublicLink,
  useDocumentPublicLinks,
  useRevokeDocumentPublicLink,
} from './hooks/use-public-links';

// Renditions
export { useDocumentRenditions, useRenditionDownloadUrl } from './hooks/use-renditions';

// Resolution
export { useBatchResolveDocumentAssets } from './hooks/use-resolution';

// Components — Documents
export { DocumentDetail } from './components/document-detail';
export type { DocumentDetailLabels, DocumentDetailProps } from './components/document-detail';

export { DocumentQuickLook } from './components/document-quick-look';
export type {
  DocumentQuickLookLabels,
  DocumentQuickLookProps,
} from './components/document-quick-look';

export { DocumentSearchPalette } from './components/document-search-palette';
export type {
  DocumentSearchPaletteLabels,
  DocumentSearchPaletteProps,
} from './components/document-search-palette';

export { DocumentsSidebar } from './components/documents-sidebar';
export type {
  DocumentsSidebarLabels,
  DocumentsSidebarProps,
  DocumentsSidebarTab,
} from './components/documents-sidebar';

export { useDocumentBookmarks } from './hooks/use-document-bookmarks';
export type {
  DocumentBookmark,
  DocumentBookmarksApi,
  UseDocumentBookmarksOptions,
} from './hooks/use-document-bookmarks';

export { DocumentsExplorer } from './components/documents-explorer';
export type {
  DocumentsExplorerLabels,
  DocumentsExplorerProps,
} from './components/documents-explorer';

export { DocumentsList } from './components/documents-list';
export type { DocumentsListLabels, DocumentsListProps } from './components/documents-list';

export { DocumentsToolbar } from './components/documents-toolbar';
export type { DocumentsToolbarLabels, DocumentsToolbarProps } from './components/documents-toolbar';

export { InlineEdit } from './components/inline-edit';
export type { InlineEditProps } from './components/inline-edit';

export { useMultiSelect } from './hooks/use-multi-select';
export type { MultiSelectApi } from './hooks/use-multi-select';

export {
  DEFAULT_TILE_SIZE,
  DEFAULT_VIEW_MODE,
  TILE_SIZE_STEPS,
  useViewPreferences,
} from './hooks/use-view-preferences';
export type {
  DocumentsViewMode,
  TileSizeStep,
  ViewPreferences,
} from './hooks/use-view-preferences';

export { classifyDocumentName, documentBadge } from './components/document-kind';
export type { DocumentKind } from './components/document-kind';

// Components — Folders
export { FolderBreadcrumb } from './components/folder-breadcrumb';
export type { FolderBreadcrumbLabels, FolderBreadcrumbProps } from './components/folder-breadcrumb';

export { FolderTree } from './components/folder-tree';
export type { FolderTreeLabels, FolderTreeProps } from './components/folder-tree';

// Components — Quota
export { QuotaBadge } from './components/quota-badge';
export type { QuotaBadgeLabels, QuotaBadgeProps } from './components/quota-badge';

export { QuotaPanel } from './components/quota-panel';
export type { QuotaPanelLabels, QuotaPanelProps } from './components/quota-panel';

// Components — Shares
export { ShareDialog } from './components/share-dialog';
export type {
  ShareDialogLabels,
  ShareDialogProps,
  ShareDialogTarget,
} from './components/share-dialog';

// Components — Ownership
export { TransferOwnershipDialog } from './components/transfer-ownership-dialog';
export type {
  TransferOwnershipDialogLabels,
  TransferOwnershipDialogProps,
  TransferOwnershipTarget,
} from './components/transfer-ownership-dialog';

// Components — Trash
export { TrashBin } from './components/trash-bin';
export type { TrashBinLabels, TrashBinProps } from './components/trash-bin';

// Components — Upload
export { UploadButton } from './components/upload-button';
export type { UploadButtonLabels, UploadButtonProps } from './components/upload-button';

export { UploadDropZone } from './components/upload-drop-zone';
export type { UploadDropZoneLabels, UploadDropZoneProps } from './components/upload-drop-zone';

export { useFileUpload } from './hooks/use-file-upload';
export type {
  FileUploadError,
  FileUploadProgress,
  UseFileUploadOptions,
  UseFileUploadResult,
} from './hooks/use-file-upload';

// Components — Versions
export { VersionsTimeline } from './components/versions-timeline';
export type { VersionsTimelineLabels, VersionsTimelineProps } from './components/versions-timeline';

// Helpers
export { formatBytes } from './components/format-bytes';

// i18n
export { documentsTranslationsEn, documentsTranslationsFr } from './locales/index';
export type { DocumentsTranslations } from './locales/index';
