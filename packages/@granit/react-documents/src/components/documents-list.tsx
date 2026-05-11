import { QueryProvider, useQueryEndpoint } from '@granit/react-query-engine';

import { useDocumentsConfig } from '../providers/documents-provider.js';

import type { DocumentResponse } from '@granit/documents';
import type { FilterEntry, SortEntry } from '@granit/query-engine';
import type { ReactNode } from 'react';

const LIST_QUERY_KEY_PREFIX = ['documents', 'documents', 'list'] as const;
const DEFAULT_PAGE_SIZE = 50;

export interface DocumentsListLabels {
  readonly empty?: string;
  readonly nameHeader?: string;
  readonly statusHeader?: string;
  readonly loading?: string;
  readonly error?: string;
  readonly previous?: string;
  readonly next?: string;
  readonly pageOf?: (page: number, total: number) => string;
}

export interface DocumentsListProps {
  readonly folderId: string;
  readonly pageSize?: number;
  readonly onOpenDocument?: (id: string) => void;
  readonly labels?: DocumentsListLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<DocumentsListLabels> = {
  empty: 'This folder is empty.',
  nameHeader: 'Name',
  statusHeader: 'Status',
  loading: 'Loading documents…',
  error: 'Failed to load documents.',
  previous: 'Previous',
  next: 'Next',
  pageOf: (page, total) => `Page ${page} of ${total}`,
};

/**
 * Lists active documents inside a folder. Backed by the QueryEngine
 * endpoint `GET {basePath}/documents/query` (granit-fx/granit-dotnet#1993).
 *
 * Pre-applies two filters: `folderId Equals <id>` and `status Equals Active`
 * (trashed documents are surfaced in {@link TrashBin} instead). Sorted by
 * `name asc` by default.
 *
 * Self-wraps in `<QueryProvider>` using the {@link useDocumentsConfig}
 * client + a derived base path, so consumers only need to mount
 * `<DocumentsProvider>` upstream.
 */
export function DocumentsList(props: Readonly<DocumentsListProps>): ReactNode {
  const config = useDocumentsConfig();

  return (
    <QueryProvider
      config={{
        client: config.client,
        basePath: `${config.basePath}/documents/query`,
        queryKeyPrefix: [...LIST_QUERY_KEY_PREFIX, props.folderId],
      }}
    >
      <DocumentsListBody {...props} />
    </QueryProvider>
  );
}

function DocumentsListBody({
  folderId,
  pageSize,
  onOpenDocument,
  labels,
  className,
}: Readonly<DocumentsListProps>): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const effectivePageSize = pageSize ?? DEFAULT_PAGE_SIZE;

  const filters: readonly FilterEntry[] = [
    { field: 'folderId', operator: 'Eq', value: folderId },
    { field: 'status', operator: 'Eq', value: 'Active' },
  ];
  const sort: readonly SortEntry[] = [{ field: 'name', direction: 'asc' }];

  const { params, query, setPage } = useQueryEndpoint<DocumentResponse>({
    initialParams: { page: 1, pageSize: effectivePageSize, filters, sort },
  });

  if (query.isLoading) {
    return (
      <div
        data-granit-documents-list=""
        data-granit-documents-list-loading=""
        className={className}
      >
        {labelStrings.loading}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div data-granit-documents-list="" data-granit-documents-list-error="" className={className}>
        {labelStrings.error}
      </div>
    );
  }

  const items = query.data?.items ?? [];
  const totalCount = query.data?.totalCount ?? 0;
  const currentPage = params.page ?? 1;
  const currentPageSize = params.pageSize ?? effectivePageSize;
  const totalPages = Math.max(1, Math.ceil(totalCount / currentPageSize));

  if (items.length === 0) {
    return (
      <div data-granit-documents-list="" className={className}>
        <div data-granit-documents-list-empty="">{labelStrings.empty}</div>
      </div>
    );
  }

  return (
    <div data-granit-documents-list="" className={className}>
      <table data-granit-documents-list-table="">
        <thead>
          <tr>
            <th>{labelStrings.nameHeader}</th>
            <th>{labelStrings.statusHeader}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((document) => (
            <tr key={document.id} data-granit-documents-list-row="">
              <td>
                {onOpenDocument ? (
                  <button type="button" onClick={() => onOpenDocument(document.id)}>
                    {document.name}
                  </button>
                ) : (
                  <span>{document.name}</span>
                )}
              </td>
              <td>{document.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <nav data-granit-documents-list-pagination="" aria-label="Pagination">
        <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>
          {labelStrings.previous}
        </button>
        <span data-granit-documents-list-page-info="">
          {labelStrings.pageOf(currentPage, totalPages)}
        </span>
        <button
          type="button"
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          {labelStrings.next}
        </button>
      </nav>
    </div>
  );
}
