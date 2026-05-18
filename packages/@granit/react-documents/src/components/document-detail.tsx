import { useState } from 'react';

import { useRenameDocument } from '../hooks/use-document-mutations.js';
import { useDocumentTagsList } from '../hooks/use-document-tags.js';
import {
  useDocument,
  useDocumentDownloadUrl,
  useDocumentVersions,
} from '../hooks/use-documents.js';

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
}

export interface DocumentDetailProps {
  readonly documentId: string;
  readonly canManage?: boolean;
  readonly onOpenVersions?: (id: string) => void;
  readonly onOpenShares?: (id: string) => void;
  readonly labels?: DocumentDetailLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<DocumentDetailLabels> = {
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
  onOpenVersions,
  onOpenShares,
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
      { id: document.id, request: { name: trimmed } },
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
        <dd>{document.ownerUserId}</dd>
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
      </div>
    </div>
  );
}
