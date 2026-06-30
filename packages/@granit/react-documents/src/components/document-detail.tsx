import { useState } from 'react';

import { useRenameDocument } from '../hooks/use-document-mutations';
import { useDocumentTagsList } from '../hooks/use-document-tags';
import { useDocument, useDocumentDownloadUrl, useDocumentVersions } from '../hooks/use-documents';

import { TransferOwnershipDialog } from './transfer-ownership-dialog';

import type { TransferOwnershipDialogLabels } from './transfer-ownership-dialog';
import type { ReactNode } from 'react';

export interface DocumentDetailLabels {
  readonly loading?: string;
  readonly notFound?: string;
  readonly owner?: string;
  readonly status?: string;
  readonly description?: string;
  readonly noDescription?: string;
  readonly download?: string;
  readonly rename?: string;
  readonly versions?: string;
  readonly shares?: string;
  readonly tags?: string;
  readonly addFavorite?: string;
  readonly removeFavorite?: string;
  readonly transferOwnership?: string;
  readonly transferOwnershipDialog?: TransferOwnershipDialogLabels;
}

export interface DocumentDetailProps {
  readonly documentId: string;
  readonly canManage?: boolean;
  /**
   * When `true`, exposes the "Transfer ownership" action. Host must gate this
   * with the `Documents.Documents.TransferOwnership` permission — the
   * component does not check permissions itself.
   */
  readonly canTransferOwnership?: boolean;
  readonly onOpenVersions?: (id: string) => void;
  readonly onOpenShares?: (id: string) => void;
  /**
   * When `true`, shows a filled star action. Toggling the star fires
   * `onToggleFavorite` with the current document. Omit the prop to hide
   * the favorite action entirely (e.g. when the host doesn't wire
   * `useDocumentBookmarks`).
   */
  readonly isFavorite?: boolean;
  readonly onToggleFavorite?: () => void;
  readonly labels?: DocumentDetailLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<Omit<DocumentDetailLabels, 'transferOwnershipDialog'>> & {
  readonly transferOwnershipDialog: TransferOwnershipDialogLabels | undefined;
} = {
  loading: 'Loading document…',
  notFound: 'Document not found.',
  owner: 'Owner',
  status: 'Status',
  description: 'Description',
  noDescription: 'No description.',
  download: 'Download current version',
  rename: 'Rename',
  versions: 'Versions',
  shares: 'Shares',
  tags: 'Tags',
  addFavorite: 'Add to favorites',
  removeFavorite: 'Remove from favorites',
  transferOwnership: 'Transfer ownership',
  transferOwnershipDialog: undefined,
};

/**
 * Detail panel for a single document. Renders name (inline-editable via
 * {@link useRenameDocument} when `canManage`), description, owner, status,
 * a list of attached tag names, and a current-version download button. The
 * download is on-demand — we never auto-refetch the presigned URL.
 */
export function DocumentDetail({
  documentId,
  canManage = false,
  canTransferOwnership = false,
  onOpenVersions,
  onOpenShares,
  isFavorite,
  onToggleFavorite,
  labels,
  className,
}: DocumentDetailProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const documentQuery = useDocument(documentId);
  const versionsQuery = useDocumentVersions(documentId, { skip: 0, take: 1 });
  const tagsQuery = useDocumentTagsList(documentId);
  const downloadUrl = useDocumentDownloadUrl(documentId, undefined, { enabled: false });
  const renameDocument = useRenameDocument();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [transferOpen, setTransferOpen] = useState(false);

  if (documentQuery.isLoading) {
    return (
      <div
        data-granit-document-detail=""
        data-granit-document-detail-loading=""
        className={className}
      >
        {labelStrings.loading}
      </div>
    );
  }
  if (!documentQuery.data) {
    return (
      <div
        data-granit-document-detail=""
        data-granit-document-detail-notfound=""
        className={className}
      >
        {labelStrings.notFound}
      </div>
    );
  }

  const document = documentQuery.data;

  function startEdit(): void {
    setDraftName(document.name);
    setEditing(true);
  }

  function commitEdit(): void {
    const trimmed = draftName.trim();
    if (trimmed.length === 0 || trimmed === document.name) {
      setEditing(false);
      return;
    }
    renameDocument.mutate(
      {
        id: document.id,
        request: { concurrencyStamp: document.concurrencyStamp, name: trimmed, description: null },
      },
      { onSuccess: () => setEditing(false) }
    );
  }

  async function handleDownload(): Promise<void> {
    const result = await downloadUrl.refetch();
    if (result.data && globalThis.window !== undefined) {
      globalThis.open(result.data.url, '_blank', 'noopener,noreferrer');
    }
  }

  const versions = versionsQuery.data?.versions ?? [];
  const totalVersions = versionsQuery.data?.totalCount ?? versions.length;
  const tagItems = tagsQuery.data?.items ?? [];

  return (
    <div data-granit-document-detail="" data-granit-document-id={document.id} className={className}>
      <header data-granit-document-detail-header="">
        {editing && canManage ? (
          <input
            data-granit-document-detail-name-input=""
            autoFocus
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onBlur={commitEdit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitEdit();
              if (event.key === 'Escape') setEditing(false);
            }}
          />
        ) : (
          <h2 data-granit-document-detail-name="">
            {document.name}
            {onToggleFavorite && (
              <button
                type="button"
                data-granit-document-detail-favorite=""
                data-granit-document-detail-favorite-on={isFavorite ? '' : undefined}
                aria-pressed={isFavorite ?? false}
                aria-label={isFavorite ? labelStrings.removeFavorite : labelStrings.addFavorite}
                onClick={onToggleFavorite}
              >
                {isFavorite ? '★' : '☆'}
              </button>
            )}
            {canManage && (
              <button type="button" onClick={startEdit} aria-label={labelStrings.rename}>
                {labelStrings.rename}
              </button>
            )}
          </h2>
        )}
      </header>

      <dl data-granit-document-detail-meta="">
        <dt>{labelStrings.owner}</dt>
        <dd>{document.ownerId}</dd>
        <dt>{labelStrings.status}</dt>
        <dd>{document.status}</dd>
        <dt>{labelStrings.description}</dt>
        <dd>{document.description ?? labelStrings.noDescription}</dd>
      </dl>

      <section data-granit-document-detail-tags="">
        <h3>{labelStrings.tags}</h3>
        <ul>
          {tagItems.map((tag) => (
            <li key={tag.id} data-granit-document-tag="" style={{ color: tag.color }}>
              {tag.name}
            </li>
          ))}
        </ul>
      </section>

      <div data-granit-document-detail-actions="">
        <button
          type="button"
          data-granit-document-detail-download=""
          onClick={() => {
            void handleDownload();
          }}
          disabled={!document.currentVersionId}
        >
          {labelStrings.download}
        </button>
        {onOpenVersions && (
          <button type="button" onClick={() => onOpenVersions(document.id)}>
            {labelStrings.versions} ({totalVersions})
          </button>
        )}
        {onOpenShares && (
          <button type="button" onClick={() => onOpenShares(document.id)}>
            {labelStrings.shares}
          </button>
        )}
        {canTransferOwnership && (
          <button
            type="button"
            data-granit-document-detail-transfer-ownership=""
            onClick={() => setTransferOpen(true)}
          >
            {labelStrings.transferOwnership}
          </button>
        )}
      </div>

      {canTransferOwnership && (
        <TransferOwnershipDialog
          open={transferOpen}
          onClose={() => setTransferOpen(false)}
          target={{ type: 'Document', id: document.id }}
          currentOwnerId={document.ownerId}
          labels={labelStrings.transferOwnershipDialog}
        />
      )}
    </div>
  );
}
