import { useCallback, useEffect, useState } from 'react';

import { useFolder } from '../hooks/use-folders.js';
import { useViewPreferences } from '../hooks/use-view-preferences.js';

import { DocumentDetail } from './document-detail.js';
import { DocumentQuickLook } from './document-quick-look.js';
import { DocumentsList } from './documents-list.js';
import { DocumentsToolbar } from './documents-toolbar.js';
import { FolderBreadcrumb } from './folder-breadcrumb.js';
import { FolderTree } from './folder-tree.js';
import { QuotaBadge } from './quota-badge.js';
import { UploadButton } from './upload-button.js';
import { UploadDropZone } from './upload-drop-zone.js';

import type { DocumentDetailLabels } from './document-detail.js';
import type { DocumentQuickLookLabels } from './document-quick-look.js';
import type { DocumentsListLabels } from './documents-list.js';
import type { DocumentsToolbarLabels } from './documents-toolbar.js';
import type { FolderBreadcrumbLabels } from './folder-breadcrumb.js';
import type { FolderTreeLabels } from './folder-tree.js';
import type { UploadButtonLabels } from './upload-button.js';
import type { UploadDropZoneLabels } from './upload-drop-zone.js';
import type { DocumentResponse, FolderResponse } from '@granit/documents';
import type { ReactNode } from 'react';

export interface DocumentsExplorerLabels {
  readonly title?: string;
  readonly inspectorEmpty?: string;
  readonly inspectorMultiple?: (count: number) => string;
  readonly tree?: FolderTreeLabels;
  readonly breadcrumb?: FolderBreadcrumbLabels;
  readonly list?: DocumentsListLabels;
  readonly toolbar?: DocumentsToolbarLabels;
  readonly upload?: UploadButtonLabels;
  readonly dropZone?: UploadDropZoneLabels;
  readonly detail?: DocumentDetailLabels;
  readonly quickLook?: DocumentQuickLookLabels;
}

export interface DocumentsExplorerProps {
  /** Optional root scope for the folder tree. `null` (default) lists the tenant root. */
  readonly rootFolderId?: string | null;
  readonly canManage?: boolean;
  readonly showQuotaBadge?: boolean;
  /** Hide / show the right inspector pane. Defaults to `true`. */
  readonly showInspector?: boolean;
  /**
   * `localStorage` key used to persist list/grid view mode + tile size. Pass
   * `null` to disable persistence (state still works in-memory). Defaults to
   * `granit-documents-view`. Tenants that want per-tenant preferences should
   * pass a tenant-scoped key.
   */
  readonly viewPreferencesStorageKey?: string | null;
  readonly onOpenDocument?: (id: string) => void;
  readonly labels?: DocumentsExplorerLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<
  Pick<DocumentsExplorerLabels, 'title' | 'inspectorEmpty' | 'inspectorMultiple'>
> = {
  title: 'Documents',
  inspectorEmpty: 'Select a document to see its details.',
  inspectorMultiple: (count) => `${String(count)} documents selected.`,
};

// The finalize hook invalidates folders + quota query families, so the
// right pane refreshes on its own — no per-callback work needed.
function noopUploadComplete(_document: DocumentResponse): void {
  /* intentional no-op */
}

/**
 * Three-pane explorer:
 *
 *   ┌─────────────┬────────────────────────────┬──────────────┐
 *   │ FolderTree  │ Breadcrumb + Toolbar +     │ Inspector    │
 *   │             │ DocumentsList + UploadBtn  │ (DocumentDetail
 *   │             │                            │  when 1 selected)
 *   └─────────────┴────────────────────────────┴──────────────┘
 *
 * The current folder is local state; selecting a folder in the tree updates
 * the breadcrumb, the document list, and resets selection. The inspector
 * binds to the focused row (single-clicked, not just checkbox-toggled).
 *
 * Selection / focus state lives here so the toolbar (bulk actions) and the
 * inspector pane stay in sync with what {@link DocumentsList} reports.
 */
export function DocumentsExplorer({
  rootFolderId = null,
  canManage = false,
  showQuotaBadge = false,
  showInspector = true,
  viewPreferencesStorageKey = 'granit-documents-view',
  onOpenDocument,
  labels,
  className,
}: DocumentsExplorerProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const [currentFolder, setCurrentFolder] = useState<FolderResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [selectedDocs, setSelectedDocs] = useState<readonly DocumentResponse[]>([]);
  const [focusedDoc, setFocusedDoc] = useState<DocumentResponse | null>(null);
  const [items, setItems] = useState<readonly DocumentResponse[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [inspectorVisible, setInspectorVisible] = useState(showInspector);
  const [clearSignal, setClearSignal] = useState(0);
  const { viewMode, tileSize, setViewMode, setTileSize } =
    useViewPreferences(viewPreferencesStorageKey);

  // Watch the live status of the current selection. After a trash mutation
  // (direct or cascading from an ancestor), the cache is invalidated and
  // this query refetches. We null the selection when the backend either
  // 404s/403s OR returns a non-Active folder — both signal the panel is
  // stale.
  const currentFolderQuery = useFolder(currentFolder?.id ?? '', {
    enabled: currentFolder !== null,
  });

  useEffect(() => {
    if (!currentFolder) return;
    if (currentFolderQuery.isError) {
      setCurrentFolder(null);
      return;
    }
    const fresh = currentFolderQuery.data;
    if (fresh && fresh.status !== 'Active') {
      setCurrentFolder(null);
    }
  }, [currentFolder, currentFolderQuery.data, currentFolderQuery.isError]);

  const handleFolderDeleted = useCallback((deletedId: string) => {
    setCurrentFolder((prev) => (prev?.id === deletedId ? null : prev));
  }, []);

  // Clear doc selection / focus when the folder changes.
  useEffect(() => {
    setSelectedIds(new Set());
    setSelectedDocs([]);
    setFocusedDoc(null);
  }, [currentFolder?.id]);

  const handleSelectionChange = useCallback(
    (ids: ReadonlySet<string>, docs: readonly DocumentResponse[]) => {
      setSelectedIds(ids);
      setSelectedDocs(docs);
    },
    []
  );

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectedDocs([]);
    setFocusedDoc(null);
    // The list owns its multi-select state internally; bump the signal so
    // it clears without remounting the underlying query subtree.
    setClearSignal((n) => n + 1);
  }, []);

  const folderId = currentFolder?.id ?? '';

  return (
    <div data-granit-documents-explorer="" className={className}>
      <header data-granit-documents-explorer-header="">
        <h1>{labelStrings.title}</h1>
        {showQuotaBadge && <QuotaBadge />}
      </header>
      <div
        data-granit-documents-explorer-body=""
        data-granit-documents-explorer-with-inspector={
          showInspector && inspectorVisible ? '' : undefined
        }
      >
        <aside data-granit-documents-explorer-tree="">
          <FolderTree
            rootFolderId={rootFolderId}
            canManage={canManage}
            currentFolderId={currentFolder?.id ?? null}
            onSelect={setCurrentFolder}
            onDeleted={handleFolderDeleted}
            labels={labels?.tree}
          />
        </aside>
        <UploadDropZone
          folderId={currentFolder?.id ?? null}
          disabled={!canManage}
          onComplete={noopUploadComplete}
          labels={labels?.dropZone}
        >
          <section data-granit-documents-explorer-main="">
            {folderId.length > 0 && (
              <FolderBreadcrumb
                folderId={folderId}
                onSelect={setCurrentFolder}
                labels={labels?.breadcrumb}
              />
            )}
            <DocumentsToolbar
              canManage={canManage}
              selected={selectedIds}
              selectedDocs={selectedDocs}
              onClearSelection={handleClearSelection}
              inspectorVisible={showInspector && inspectorVisible}
              onToggleInspector={showInspector ? () => setInspectorVisible((v) => !v) : undefined}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              tileSize={tileSize}
              onTileSizeChange={setTileSize}
              labels={labels?.toolbar}
              trailing={
                canManage && (
                  <UploadButton
                    folderId={currentFolder?.id ?? null}
                    onComplete={noopUploadComplete}
                    labels={labels?.upload}
                  />
                )
              }
            />
            <DocumentsList
              folderId={folderId}
              canManage={canManage}
              viewMode={viewMode}
              tileSize={tileSize}
              clearSignal={clearSignal}
              onOpenDocument={onOpenDocument}
              onPreviewDocument={(doc) => setPreviewId(doc.id)}
              onSelectionChange={handleSelectionChange}
              onFocusChange={setFocusedDoc}
              onItemsChange={setItems}
              labels={labels?.list}
            />
          </section>
        </UploadDropZone>
        <DocumentQuickLook
          documentId={previewId}
          siblings={items}
          onNavigate={setPreviewId}
          onClose={() => setPreviewId(null)}
          labels={labels?.quickLook}
        />
        {showInspector && inspectorVisible && (
          <aside data-granit-documents-explorer-inspector="">
            {focusedDoc ? (
              <DocumentDetail
                documentId={focusedDoc.id}
                canManage={canManage}
                labels={labels?.detail}
              />
            ) : selectedIds.size > 1 ? (
              <div data-granit-documents-explorer-inspector-multi="">
                {labelStrings.inspectorMultiple(selectedIds.size)}
              </div>
            ) : (
              <div data-granit-documents-explorer-inspector-empty="">
                {labelStrings.inspectorEmpty}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
