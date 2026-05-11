import { useState } from 'react';

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

  const folderId = currentFolder?.id ?? '';

  function handleUploadComplete(_document: DocumentResponse): void {
    // The finalize hook already invalidates the folders + quota query
    // families, so the right pane will refresh on its own once a real
    // listing endpoint backs DocumentsList.
  }

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
          />
        </aside>
        <section data-granit-documents-explorer-main="">
          {folderId.length > 0 && (
            <FolderBreadcrumb folderId={folderId} onSelect={setCurrentFolder} />
          )}
          <DocumentsList folderId={folderId} onOpenDocument={onOpenDocument} />
          {canManage && (
            <UploadButton folderId={currentFolder?.id ?? null} onComplete={handleUploadComplete} />
          )}
        </section>
      </div>
    </div>
  );
}
