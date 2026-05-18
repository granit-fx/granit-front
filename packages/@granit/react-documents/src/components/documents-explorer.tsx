import { useCallback, useEffect, useState } from 'react';

import { useFolder } from '../hooks/use-folders.js';

import { DocumentsList } from './documents-list.js';
import { FolderBreadcrumb } from './folder-breadcrumb.js';
import { FolderTree } from './folder-tree.js';
import { QuotaBadge } from './quota-badge.js';
import { UploadButton } from './upload-button.js';

import type { DocumentResponse, FolderResponse } from '@granit/documents';
import type { ReactNode } from 'react';

export interface DocumentsExplorerLabels {
  readonly title?: string;
}

export interface DocumentsExplorerProps {
  /** Optional root scope for the folder tree. `null` (default) lists the tenant root. */
  readonly rootFolderId?: string | null;
  readonly canManage?: boolean;
  readonly showQuotaBadge?: boolean;
  readonly onOpenDocument?: (id: string) => void;
  readonly labels?: DocumentsExplorerLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<DocumentsExplorerLabels> = {
  title: 'Documents',
};

/**
 * Two-pane explorer layout — folder tree on the left, breadcrumb / document
 * list / upload on the right. The current folder is local state; selecting
 * a folder in the tree updates the breadcrumb and the document list. The
 * document list itself is a seam ({@link DocumentsList}) until
 * `granit-fx/granit-dotnet#1990` ships the flat folder-documents endpoint.
 */
// The finalize hook invalidates folders + quota query families, so the
// right pane refreshes on its own — no per-callback work needed.
function noopUploadComplete(_document: DocumentResponse): void {
  /* intentional no-op */
}

export function DocumentsExplorer({
  rootFolderId = null,
  canManage = false,
  showQuotaBadge = false,
  onOpenDocument,
  labels,
  className,
}: DocumentsExplorerProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const [currentFolder, setCurrentFolder] = useState<FolderResponse | null>(null);

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

  const folderId = currentFolder?.id ?? '';

  return (
    <div data-granit-documents-explorer="" className={className}>
      <header data-granit-documents-explorer-header="">
        <h1>{labelStrings.title}</h1>
        {showQuotaBadge && <QuotaBadge />}
      </header>
      <div data-granit-documents-explorer-body="">
        <aside data-granit-documents-explorer-tree="">
          <FolderTree
            rootFolderId={rootFolderId}
            canManage={canManage}
            onSelect={setCurrentFolder}
            onDeleted={handleFolderDeleted}
          />
        </aside>
        <section data-granit-documents-explorer-main="">
          {folderId.length > 0 && (
            <FolderBreadcrumb folderId={folderId} onSelect={setCurrentFolder} />
          )}
          <DocumentsList folderId={folderId} onOpenDocument={onOpenDocument} />
          {canManage && (
            <UploadButton folderId={currentFolder?.id ?? null} onComplete={noopUploadComplete} />
          )}
        </section>
      </div>
    </div>
  );
}
