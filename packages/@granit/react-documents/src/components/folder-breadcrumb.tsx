import { useFolderBreadcrumb } from '../hooks/use-folders';

import type { FolderResponse } from '@granit/documents';
import type { ReactNode } from 'react';

export interface FolderBreadcrumbLabels {
  readonly loading?: string;
  readonly root?: string;
}

export interface FolderBreadcrumbProps {
  readonly folderId: string;
  readonly onSelect?: (folder: FolderResponse) => void;
  readonly separator?: ReactNode;
  readonly labels?: FolderBreadcrumbLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<FolderBreadcrumbLabels> = {
  loading: 'Loading…',
  root: 'Root',
};

/**
 * Read-only chevron-separated breadcrumb for a folder (root → leaf). Pulls
 * the chain through {@link useFolderBreadcrumb}; renders the loading label
 * while the request is pending. Headless — apps style via `className` and
 * the `data-granit-folder-breadcrumb*` attributes.
 */
export function FolderBreadcrumb({
  folderId,
  onSelect,
  separator = '›',
  labels,
  className,
}: FolderBreadcrumbProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const query = useFolderBreadcrumb(folderId);

  if (query.isLoading) {
    return (
      <div
        data-granit-folder-breadcrumb=""
        data-granit-folder-breadcrumb-loading=""
        className={className}
      >
        {labelStrings.loading}
      </div>
    );
  }

  const segments = query.data?.folders ?? [];

  return (
    <nav data-granit-folder-breadcrumb="" aria-label="Breadcrumb" className={className}>
      <ol>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <li key={segment.id} data-granit-folder-breadcrumb-segment="">
              {onSelect && !isLast ? (
                <button type="button" onClick={() => onSelect(segment)}>
                  {segment.name}
                </button>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>{segment.name}</span>
              )}
              {!isLast && (
                <span data-granit-folder-breadcrumb-separator="" aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
