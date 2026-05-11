import { useState } from 'react';

import {
  usePermanentlyDeleteDocument,
  useRestoreDocument,
} from '../hooks/use-document-mutations.js';
import { useTrashedDocuments } from '../hooks/use-documents.js';

import type { ReactNode } from 'react';

export interface TrashBinLabels {
  readonly title?: string;
  readonly empty?: string;
  readonly loading?: string;
  readonly nameHeader?: string;
  readonly trashedAtHeader?: string;
  readonly countdownHeader?: string;
  readonly daysRemaining?: string;
  readonly restore?: string;
  readonly permanentlyDelete?: string;
  readonly permanentlyDeleteConfirm?: string;
  readonly previous?: string;
  readonly next?: string;
}

export interface TrashBinProps {
  readonly pageSize?: number;
  readonly canManage?: boolean;
  readonly labels?: TrashBinLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<TrashBinLabels> = {
  title: 'Trash',
  empty: 'Trash is empty.',
  loading: 'Loading trash…',
  nameHeader: 'Name',
  trashedAtHeader: 'Trashed',
  countdownHeader: 'Auto-deletion',
  daysRemaining: 'days left',
  restore: 'Restore',
  permanentlyDelete: 'Permanently delete',
  permanentlyDeleteConfirm: 'Permanently delete this document? This cannot be undone.',
  previous: 'Previous',
  next: 'Next',
};

const URGENT_THRESHOLD_DAYS = 7;

/**
 * Tenant trash view. Lists trashed documents with a per-row countdown
 * before the empty-trash background job permanently deletes them; rows
 * within {@link URGENT_THRESHOLD_DAYS} are flagged as urgent for app-side
 * styling. Restore and permanent-delete actions are gated on `canManage`;
 * permanent delete requires a double confirm.
 */
export function TrashBin({
  pageSize = 20,
  canManage = false,
  labels,
  className,
}: TrashBinProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const [skip, setSkip] = useState(0);
  const query = useTrashedDocuments({ skip, take: pageSize });
  const restoreDocument = useRestoreDocument();
  const permanentlyDeleteDocument = usePermanentlyDeleteDocument();

  function handlePermanentDelete(id: string): void {
    if (typeof window === 'undefined') return;
    if (!window.confirm(labelStrings.permanentlyDeleteConfirm)) return;
    if (!window.confirm(labelStrings.permanentlyDeleteConfirm)) return;
    permanentlyDeleteDocument.mutate(id);
  }

  if (query.isLoading) {
    return (
      <div data-granit-trash-bin="" data-granit-trash-bin-loading="" className={className}>
        {labelStrings.loading}
      </div>
    );
  }

  const documents = query.data?.documents ?? [];
  const totalCount = query.data?.totalCount ?? documents.length;
  const hasPrevious = skip > 0;
  const hasNext = skip + pageSize < totalCount;

  return (
    <div data-granit-trash-bin="" className={className}>
      <header data-granit-trash-bin-header="">
        <h2>{labelStrings.title}</h2>
      </header>

      {documents.length === 0 ? (
        <div data-granit-trash-bin-empty="">{labelStrings.empty}</div>
      ) : (
        <table data-granit-trash-bin-table="">
          <thead>
            <tr>
              <th>{labelStrings.nameHeader}</th>
              <th>{labelStrings.trashedAtHeader}</th>
              <th>{labelStrings.countdownHeader}</th>
              {canManage && <th />}
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => {
              const urgent = document.daysUntilPermanentDeletion < URGENT_THRESHOLD_DAYS;
              return (
                <tr
                  key={document.id}
                  data-granit-trash-bin-row=""
                  data-granit-document-id={document.id}
                  data-granit-trash-bin-urgent={urgent ? '' : undefined}
                >
                  <td>{document.name}</td>
                  <td>{document.trashedAt}</td>
                  <td>
                    <span data-granit-trash-bin-countdown="">
                      {document.daysUntilPermanentDeletion} {labelStrings.daysRemaining}
                    </span>
                  </td>
                  {canManage && (
                    <td data-granit-trash-bin-actions="">
                      <button type="button" onClick={() => restoreDocument.mutate(document.id)}>
                        {labelStrings.restore}
                      </button>
                      <button type="button" onClick={() => handlePermanentDelete(document.id)}>
                        {labelStrings.permanentlyDelete}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <nav data-granit-trash-bin-pagination="">
        <button
          type="button"
          disabled={!hasPrevious}
          onClick={() => setSkip((current) => Math.max(0, current - pageSize))}
        >
          {labelStrings.previous}
        </button>
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => setSkip((current) => current + pageSize)}
        >
          {labelStrings.next}
        </button>
      </nav>
    </div>
  );
}
