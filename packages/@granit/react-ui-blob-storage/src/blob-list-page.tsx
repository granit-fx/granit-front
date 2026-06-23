import { BlobStoragePermissions } from '@granit/blob-storage';
import { usePermissions } from '@granit/react-authorization';
import { useDeleteBlob, useDownloadUrl } from '@granit/react-blob-storage';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { QueryProvider, useQueryEndpoint, useQueryMeta } from '@granit/react-query-engine';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  StatusBadge,
  type StatusBadgeIntent,
  toast,
} from '@granit/react-ui';
import {
  FilterPresets,
  GroupBySelector,
  QueryEndpointDataTable,
  SortSelector,
} from '@granit/react-ui-admin-kit';
import { Download, MoreHorizontal, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { BlobCleanupOrphansButton } from './components/blob-cleanup-orphans-button';
import { BlobDeleteDialog } from './components/blob-delete-dialog';
import { logger } from './logger';

import type { BlobDescriptorListItem, BlobStatus } from '@granit/blob-storage';
import type { QueryConfig } from '@granit/query-engine';
import type { CellContext, ColumnDef } from '@tanstack/react-table';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

const QUERY_CONFIG: QueryConfig = {
  basePath: '/api/v1/blob-storage/blobs',
};

function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const STATUS_INTENT: Record<BlobStatus, StatusBadgeIntent> = {
  Pending: 'warning',
  Uploading: 'accent',
  Valid: 'success',
  Rejected: 'danger',
  Deleted: 'neutral',
};

const STATUS_KEY: Record<BlobStatus, string> = {
  Pending: 'BlobStorage.Status.Pending',
  Uploading: 'BlobStorage.Status.Uploading',
  Valid: 'BlobStorage.Status.Valid',
  Rejected: 'BlobStorage.Status.Rejected',
  Deleted: 'BlobStorage.Status.Deleted',
};

// Module-scope cell renderers — hoisted out of the column factory so
// Sonar's "component-defined-inside-parent" heuristic stops firing on
// inline `cell: ({ getValue }) => <Foo …/>` arrows.
function renderFileNameCell(info: CellContext<BlobDescriptorListItem, unknown>): React.ReactNode {
  return <FileNameCell value={info.getValue<string>()} />;
}

function renderContainerCell(info: CellContext<BlobDescriptorListItem, unknown>): React.ReactNode {
  return <ContainerCell value={info.getValue<string>()} />;
}

function renderMonoCellBlob(info: CellContext<BlobDescriptorListItem, unknown>): React.ReactNode {
  return <MonoCell value={info.getValue<string>()} />;
}

function renderSizeCell(info: CellContext<BlobDescriptorListItem, unknown>): React.ReactNode {
  return formatFileSize(info.getValue<number | null | undefined>());
}

function renderStatusCell(t: TranslateFn) {
  return function StatusCell(info: CellContext<BlobDescriptorListItem, unknown>): React.ReactNode {
    const status = info.getValue<BlobStatus>();
    if (!(status in STATUS_INTENT)) {
      return <Badge variant="outline">{String(status ?? '—')}</Badge>;
    }
    return <BlobStatusChip status={status} label={t(STATUS_KEY[status], status)} />;
  };
}

function renderActionsCell(
  canManage: boolean,
  onDownload: (blob: BlobDescriptorListItem) => void,
  onDelete: (blob: BlobDescriptorListItem) => void,
  t: TranslateFn
) {
  return function ActionsCell(info: CellContext<BlobDescriptorListItem, unknown>): React.ReactNode {
    return (
      <BlobRowActions
        blob={info.row.original}
        canManage={canManage}
        onDownload={onDownload}
        onDelete={onDelete}
        t={t}
      />
    );
  };
}

function FileNameCell({ value }: { readonly value: string }) {
  return (
    <span className="max-w-[260px] truncate font-mono text-xs" title={value}>
      {value}
    </span>
  );
}

function ContainerCell({ value }: { readonly value: string }) {
  return (
    <Badge variant="secondary" className="font-mono text-xs">
      {value}
    </Badge>
  );
}

function MonoCell({ value }: { readonly value: string }) {
  return <span className="font-mono text-xs">{value}</span>;
}

function BlobStatusChip({
  status,
  label,
}: {
  readonly status: BlobStatus;
  readonly label: string;
}) {
  return <StatusBadge intent={STATUS_INTENT[status]}>{label}</StatusBadge>;
}

interface BlobRowActionsProps {
  readonly blob: BlobDescriptorListItem;
  readonly canManage: boolean;
  readonly onDownload: (blob: BlobDescriptorListItem) => void;
  readonly onDelete: (blob: BlobDescriptorListItem) => void;
  readonly t: TranslateFn;
}

function BlobRowActions({ blob, canManage, onDownload, onDelete, t }: BlobRowActionsProps) {
  const isDownloadable = blob.status === 'Valid';
  const isDeleted = blob.status === 'Deleted';

  if (!canManage) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={t('Common.Actions', 'Actions')}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onDownload(blob)} disabled={!isDownloadable}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {t('BlobStorage.Actions.Download', 'Download')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(blob)}
          disabled={isDeleted}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {t('BlobStorage.Actions.Delete', 'Delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BlobStorageContent() {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(BlobStoragePermissions.Administration.Manage);

  const meta = useQueryMeta();
  const queryEndpoint = useQueryEndpoint<BlobDescriptorListItem>({
    initialParams: {
      page: 1,
      pageSize: 20,
      sort: [{ field: 'createdAt', direction: 'desc' }],
    },
  });

  const downloadMutation = useDownloadUrl();
  const deleteMutation = useDeleteBlob();

  const [deleteTarget, setDeleteTarget] = useState<BlobDescriptorListItem | null>(null);

  const handleDownload = useCallback(
    async (blob: BlobDescriptorListItem) => {
      try {
        const { downloadUrl } = await downloadMutation.mutateAsync({
          id: blob.id,
          request: { containerName: blob.containerName, fileName: blob.originalFileName },
        });
        // Pre-signed URL — open in a new tab so the browser handles the
        // Content-Disposition header from the storage backend.
        globalThis.open(downloadUrl, '_blank', 'noopener,noreferrer');
      } catch (err) {
        // API errors are surfaced by the global MutationCache.onError toast.
        logger.error('[BlobList] Download failed', err);
      }
    },
    [downloadMutation]
  );

  const handleConfirmDelete = async (deletionReason: string | undefined) => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({
        id: deleteTarget.id,
        request: { containerName: deleteTarget.containerName, deletionReason },
      });
      toast.success(
        t('BlobStorage.Actions.DeleteSuccess', {
          defaultValue: '"{{name}}" deleted',
          name: deleteTarget.originalFileName,
        })
      );
      setDeleteTarget(null);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[BlobList] Delete failed', err);
    }
  };

  const columns = useMemo<ColumnDef<BlobDescriptorListItem>[]>(
    () => [
      {
        accessorKey: 'originalFileName',
        header: t('BlobStorage.Columns.FileName', 'File name'),
        cell: renderFileNameCell,
      },
      {
        accessorKey: 'containerName',
        header: t('BlobStorage.Columns.Container', 'Container'),
        cell: renderContainerCell,
      },
      {
        accessorKey: 'declaredContentType',
        header: t('BlobStorage.Columns.ContentType', 'Content type'),
        cell: renderMonoCellBlob,
      },
      {
        accessorKey: 'sizeBytes',
        header: t('BlobStorage.Columns.Size', 'Size'),
        cell: renderSizeCell,
      },
      {
        accessorKey: 'status',
        header: t('BlobStorage.Columns.Status', 'Status'),
        cell: renderStatusCell(t),
      },
      {
        accessorKey: 'createdAt',
        header: t('BlobStorage.Columns.CreatedAt', 'Created at'),
        cell: ({ getValue }) => formatDateTime(getValue<string>()),
      },
      ...(canManage
        ? [
            {
              id: 'actions',
              header: '',
              cell: renderActionsCell(canManage, handleDownload, setDeleteTarget, t),
            } satisfies ColumnDef<BlobDescriptorListItem>,
          ]
        : []),
    ],
    [t, formatDateTime, canManage, handleDownload]
  );

  return (
    <div data-slot="blob-list-page" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('BlobStorage.Title', 'Blob Storage')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('BlobStorage.Description', 'Manage uploaded files and blob containers.')}
          </p>
        </div>
        {canManage && <BlobCleanupOrphansButton />}
      </div>

      {meta.data && (
        <div className="flex flex-wrap items-center gap-2">
          {meta.data.presetFilterGroups.length > 0 && (
            <FilterPresets
              groups={meta.data.presetFilterGroups}
              activePresets={queryEndpoint.params.presets ?? {}}
              onToggle={queryEndpoint.setPresets}
            />
          )}
          <SortSelector
            columns={meta.data.columns}
            sort={queryEndpoint.params.sort}
            onToggleSort={queryEndpoint.toggleSort}
          />
          {meta.data.groupByFields.length > 0 && (
            <GroupBySelector
              fields={meta.data.groupByFields}
              columns={meta.data.columns}
              value={queryEndpoint.params.groupBy}
              onValueChange={queryEndpoint.setGroupBy}
            />
          )}
          <span className="ml-auto text-sm text-muted-foreground">
            {queryEndpoint.isGrouped
              ? (queryEndpoint.groupedQuery.data?.totalCount ?? 0)
              : (queryEndpoint.query.data?.totalCount ?? 0)}{' '}
            {t('BlobStorage.Records', 'files')}
          </span>
        </div>
      )}

      <QueryEndpointDataTable queryEndpoint={queryEndpoint} columns={columns} />

      <BlobDeleteDialog
        blob={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

export function BlobListPage() {
  return (
    <QueryProvider config={QUERY_CONFIG}>
      <BlobStorageContent />
    </QueryProvider>
  );
}
