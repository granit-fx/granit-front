import { useState } from 'react';

import { useDocumentDownloadUrl, useDocumentVersions } from '../hooks/use-documents.js';

import { formatBytes } from './format-bytes.js';

import type { DocumentVersionResponse } from '@granit/documents';
import type { ReactNode } from 'react';

export interface VersionsTimelineLabels {
  readonly title?: string;
  readonly empty?: string;
  readonly loading?: string;
  readonly versionHeader?: string;
  readonly authorHeader?: string;
  readonly dateHeader?: string;
  readonly sizeHeader?: string;
  readonly messageHeader?: string;
  readonly download?: string;
  readonly current?: string;
  readonly previous?: string;
  readonly next?: string;
}

export interface VersionsTimelineProps {
  readonly documentId: string;
  readonly pageSize?: number;
  readonly labels?: VersionsTimelineLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<VersionsTimelineLabels> = {
  title: 'Version history',
  empty: 'No versions yet.',
  loading: 'Loading versions…',
  versionHeader: 'Version',
  authorHeader: 'Author',
  dateHeader: 'Date',
  sizeHeader: 'Size',
  messageHeader: 'Message',
  download: 'Download',
  current: 'current',
  previous: 'Previous',
  next: 'Next',
};

interface VersionRowProps {
  readonly documentId: string;
  readonly version: DocumentVersionResponse;
  readonly labels: Required<VersionsTimelineLabels>;
}

function VersionRow({ documentId, version, labels }: Readonly<VersionRowProps>): ReactNode {
  const downloadUrl = useDocumentDownloadUrl(documentId, version.id, { enabled: false });

  async function handleDownload(): Promise<void> {
    const result = await downloadUrl.refetch();
    if (result.data && globalThis.window !== undefined) {
      globalThis.open(result.data.url, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <tr
      data-granit-versions-timeline-row=""
      data-granit-version-id={version.id}
      data-granit-version-current={version.isCurrent ? '' : undefined}
    >
      <td>
        {version.versionNumber}
        {version.isCurrent && (
          <span data-granit-versions-timeline-current=""> ({labels.current})</span>
        )}
      </td>
      <td>{version.uploadedByUserId}</td>
      <td>{version.uploadedAt}</td>
      <td>{formatBytes(version.sizeBytes)}</td>
      <td>{version.commitMessage}</td>
      <td>
        <button
          type="button"
          onClick={() => {
            void handleDownload();
          }}
        >
          {labels.download}
        </button>
      </td>
    </tr>
  );
}

/**
 * Paginated version history (latest first) for a single document. Local
 * `skip` state drives the page; server caps `take` at 200. Each row exposes
 * a per-version download button that lazily refetches the presigned URL.
 */
export function VersionsTimeline({
  documentId,
  pageSize = 20,
  labels,
  className,
}: VersionsTimelineProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const [skip, setSkip] = useState(0);
  const query = useDocumentVersions(documentId, { skip, take: pageSize });

  if (query.isLoading) {
    return (
      <div
        data-granit-versions-timeline=""
        data-granit-versions-timeline-loading=""
        className={className}
      >
        {labelStrings.loading}
      </div>
    );
  }

  const versions = query.data?.versions ?? [];
  const totalCount = query.data?.totalCount ?? versions.length;
  const hasPrevious = skip > 0;
  const hasNext = skip + pageSize < totalCount;

  if (versions.length === 0) {
    return (
      <div data-granit-versions-timeline="" className={className}>
        <h3>{labelStrings.title}</h3>
        <div data-granit-versions-timeline-empty="">{labelStrings.empty}</div>
      </div>
    );
  }

  return (
    <div data-granit-versions-timeline="" className={className}>
      <h3>{labelStrings.title}</h3>
      <table data-granit-versions-timeline-table="">
        <thead>
          <tr>
            <th>{labelStrings.versionHeader}</th>
            <th>{labelStrings.authorHeader}</th>
            <th>{labelStrings.dateHeader}</th>
            <th>{labelStrings.sizeHeader}</th>
            <th>{labelStrings.messageHeader}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {versions.map((version) => (
            <VersionRow
              key={version.id}
              documentId={documentId}
              version={version}
              labels={labelStrings}
            />
          ))}
        </tbody>
      </table>
      <nav data-granit-versions-timeline-pagination="">
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
