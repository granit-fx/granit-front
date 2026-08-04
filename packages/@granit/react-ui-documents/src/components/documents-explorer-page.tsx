import { usePermissions } from '@granit/react-authorization';
import { DocumentsExplorer, QuotaBadge } from '@granit/react-documents';
import { useTranslation } from '@granit/react-localization';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';

import { DOCUMENTS_PERMISSIONS } from '../constants';

import type { DocumentsExplorerLabels } from '@granit/react-documents';

export function DocumentsExplorerPage() {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const canManage = hasPermission(DOCUMENTS_PERMISSIONS.Documents.Manage);
  // One flag covers both document- and folder-level transfer permissions,
  // matching the explorer's single `canTransferOwnership` prop. Hosts that
  // grant only one of the two will not see the button — which is the safer
  // default for an explorer that mixes both targets in the same UI.
  const canTransferOwnership =
    hasPermission(DOCUMENTS_PERMISSIONS.Documents.TransferOwnership) &&
    hasPermission(DOCUMENTS_PERMISSIONS.Folders.TransferOwnership);

  // Headless package → host owns localization. Build the full label bundle
  // from the `documents` namespace so the tree, list, toolbar and inspector
  // are all localized in one place.
  const labels = useMemo<DocumentsExplorerLabels>(
    () => ({
      title: t('documents:Explorer.Title', 'Documents'),
      inspectorEmpty: t(
        'documents:Explorer.InspectorEmpty',
        'Select a document to see its details.'
      ),
      inspectorMultiple: (count) =>
        t('documents:Explorer.InspectorMultiple', '{{count}} documents selected.', { count }),
      tree: {
        add: t('documents:Folder.Tree.Add', 'New folder'),
        addRoot: t('documents:Folder.Tree.AddRoot', 'New root folder'),
        rename: t('documents:Folder.Tree.Rename', 'Rename'),
        delete: t('documents:Folder.Tree.Delete', 'Delete'),
        deleteConfirmQuestion: t(
          'documents:Folder.Tree.DeleteConfirmQuestion',
          'Move this folder to the trash? Its contents will be trashed too.'
        ),
        deleteConfirm: t('documents:Folder.Tree.DeleteConfirm', 'Confirm'),
        deleteCancel: t('documents:Folder.Tree.DeleteCancel', 'Cancel'),
        empty: t('documents:Folder.Tree.Empty', 'No folders.'),
        loading: t('documents:Folder.Tree.Loading', 'Loading…'),
        error: t('documents:Folder.Tree.Error', 'Failed to load folders.'),
        newFolderName: t('documents:Folder.Tree.NewFolderName', 'Folder name'),
        transferOwnership: t('documents:TransferOwnership.FolderTrigger', 'Transfer ownership'),
      },
      list: {
        empty: t('documents:Document.List.Empty', 'This folder is empty.'),
        nameHeader: t('documents:Document.List.NameHeader', 'Name'),
        statusHeader: t('documents:Document.List.StatusHeader', 'Status'),
        selectHeader: t('documents:Document.List.SelectHeader', 'Select all'),
        selectRow: t('documents:Document.List.SelectRow', 'Select'),
        rename: t('documents:Document.List.Rename', 'Rename'),
        trash: t('documents:Document.List.Trash', 'Move to trash'),
        trashConfirm: t('documents:Document.List.TrashConfirm', 'Confirm'),
        trashCancel: t('documents:Document.List.TrashCancel', 'Cancel'),
        loading: t('documents:Document.List.Loading', 'Loading documents…'),
        error: t('documents:Document.List.Error', 'Failed to load documents.'),
        previous: t('documents:Document.List.Previous', 'Previous'),
        next: t('documents:Document.List.Next', 'Next'),
      },
      toolbar: {
        noSelection: t('documents:Document.Toolbar.NoSelection', 'No selection'),
        oneSelected: (name) =>
          t('documents:Document.Toolbar.OneSelected', 'Selected: {{name}}', { name }),
        manySelected: (count) =>
          t('documents:Document.Toolbar.ManySelected', '{{count}} selected', { count }),
        clearSelection: t('documents:Document.Toolbar.ClearSelection', 'Clear selection'),
        bulkTrash: t('documents:Document.Toolbar.BulkTrash', 'Move to trash'),
        bulkTrashConfirm: (count) =>
          t('documents:Document.Toolbar.BulkTrashConfirm', 'Move {{count}} item(s) to trash?', {
            count,
          }),
        bulkTrashConfirmOk: t('documents:Document.Toolbar.BulkTrashConfirmOk', 'Confirm'),
        bulkTrashCancel: t('documents:Document.Toolbar.BulkTrashCancel', 'Cancel'),
        inspectorToggle: t('documents:Document.Toolbar.InspectorToggle', 'Toggle inspector'),
        viewList: t('documents:Document.Toolbar.ViewList', 'List view'),
        viewGrid: t('documents:Document.Toolbar.ViewGrid', 'Grid view'),
        zoom: t('documents:Document.Toolbar.Zoom', 'Tile size'),
      },
      upload: {
        button: t('documents:Document.Upload.Button', 'Upload'),
        uploading: t('documents:Document.Upload.Uploading', 'Uploading…'),
        quotaExceeded: t(
          'documents:Document.Upload.QuotaExceeded',
          'Tenant storage quota exceeded.'
        ),
        tooLarge: t('documents:Document.Upload.TooLarge', 'File is too large.'),
        failed: t('documents:Document.Upload.Failed', 'Upload failed.'),
      },
      dropZone: {
        overlay: t('documents:Document.DropZone.Overlay', 'Drop files to upload'),
        uploadingCount: (done, total) =>
          t('documents:Document.DropZone.UploadingCount', 'Uploading {{done}} / {{total}}…', {
            done,
            total,
          }),
        tooLarge: t('documents:Document.DropZone.TooLarge', 'File is too large.'),
        quotaExceeded: t(
          'documents:Document.DropZone.QuotaExceeded',
          'Tenant storage quota exceeded.'
        ),
        failed: t('documents:Document.DropZone.Failed', 'Upload failed.'),
      },
      detail: {
        loading: t('documents:Document.Detail.Loading', 'Loading document…'),
        notFound: t('documents:Document.Detail.NotFound', 'Document not found.'),
        owner: t('documents:Document.Detail.Owner', 'Owner'),
        status: t('documents:Document.Detail.Status', 'Status'),
        description: t('documents:Document.Detail.Description', 'Description'),
        noDescription: t('documents:Document.Detail.NoDescription', 'No description.'),
        download: t('documents:Document.Detail.Download', 'Download current version'),
        rename: t('documents:Document.Detail.Rename', 'Rename'),
        versions: t('documents:Document.Detail.Versions', 'Versions'),
        shares: t('documents:Document.Detail.Shares', 'Shares'),
        tags: t('documents:Document.Detail.Tags', 'Tags'),
        addFavorite: t('documents:Document.Detail.AddFavorite', 'Add to favorites'),
        removeFavorite: t('documents:Document.Detail.RemoveFavorite', 'Remove from favorites'),
        transferOwnership: t('documents:TransferOwnership.DocumentTrigger', 'Transfer ownership'),
      },
      quickLook: {
        title: t('documents:QuickLook.Title', 'Preview'),
        close: t('documents:QuickLook.Close', 'Close'),
        download: t('documents:QuickLook.Download', 'Download'),
        previous: t('documents:QuickLook.Previous', 'Previous'),
        next: t('documents:QuickLook.Next', 'Next'),
        loading: t('documents:QuickLook.Loading', 'Loading…'),
        loadingPreview: t('documents:QuickLook.LoadingPreview', 'Loading preview…'),
        unsupportedKind: (kind) =>
          t('documents:QuickLook.Unsupported', 'No preview available for {{kind}} files.', {
            kind,
          }),
        downloadToView: t('documents:QuickLook.DownloadToView', 'Download to view'),
        previewError: t('documents:QuickLook.PreviewError', 'Failed to load preview.'),
        position: (current, total) =>
          t('documents:QuickLook.Position', '{{current}} / {{total}}', { current, total }),
      },
      searchPalette: {
        title: t('documents:SearchPalette.Title', 'Search documents'),
        placeholder: t('documents:SearchPalette.Placeholder', 'Type a name…'),
        searching: t('documents:SearchPalette.Searching', 'Searching…'),
        noResults: t('documents:SearchPalette.NoResults', 'No results.'),
        recents: t('documents:SearchPalette.Recents', 'Recent'),
        favorites: t('documents:SearchPalette.Favorites', 'Favorites'),
        results: t('documents:SearchPalette.Results', 'Results'),
        close: t('documents:SearchPalette.Close', 'Close'),
        hint: t('documents:SearchPalette.Hint', '↑↓ to navigate, ↵ to open, Esc to close'),
      },
      sidebar: {
        foldersTab: t('documents:Sidebar.FoldersTab', 'Folders'),
        favoritesTab: t('documents:Sidebar.FavoritesTab', 'Favorites'),
        recentsTab: t('documents:Sidebar.RecentsTab', 'Recent'),
        favoritesEmpty: t(
          'documents:Sidebar.FavoritesEmpty',
          'No favorites yet. Star a document in the inspector to pin it here.'
        ),
        recentsEmpty: t(
          'documents:Sidebar.RecentsEmpty',
          'No recent documents. Open one to see it here.'
        ),
        removeFavorite: t('documents:Sidebar.RemoveFavorite', 'Remove favorite'),
      },
    }),
    [t]
  );

  return (
    <div data-slot="documents-explorer-page" className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('documents:Explorer.Title', 'Documents')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('documents:Explorer.Subtitle', 'Browse, upload, and manage your tenant documents.')}
          </p>
        </div>
        <QuotaBadge
          labels={{
            loading: t('documents:Quota.Loading', 'Loading quota…'),
          }}
        />
      </header>

      <DocumentsExplorer
        canManage={canManage}
        canTransferOwnership={canTransferOwnership}
        onOpenDocument={(id) => {
          Promise.resolve(navigate(`/documents/${id}`)).catch(() => undefined);
        }}
        labels={labels}
      />
    </div>
  );
}
