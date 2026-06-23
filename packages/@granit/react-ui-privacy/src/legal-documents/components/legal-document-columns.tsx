import { usePermissions } from '@granit/react-authorization';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@granit/react-ui';
import { MoreHorizontal } from 'lucide-react';

import { LegalDocumentStatusBadge } from './legal-document-status-badge';

import type { LegalDocumentDetailResponse } from '@granit/privacy';
import type { ColumnDef } from '@tanstack/react-table';

interface ColumnActions {
  onViewVersions: (documentId: string) => void;
  onEdit: (id: string) => void;
  onPublish: (doc: LegalDocumentDetailResponse) => void;
}

export function useLegalDocumentColumns(
  actions: ColumnActions
): ColumnDef<LegalDocumentDetailResponse>[] {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('Privacy.LegalDocuments.Manage');

  const { formatDateTime } = useDateFormatter();

  return [
    {
      id: 'documentId',
      accessorKey: 'documentId',
      header: t('Privacy.LegalDocuments.Columns.DocumentId'),
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.documentId}</span>,
    },
    {
      id: 'displayName',
      accessorKey: 'displayName',
      header: t('Privacy.LegalDocuments.Columns.DisplayName'),
    },
    {
      id: 'version',
      accessorKey: 'version',
      header: t('Privacy.LegalDocuments.Columns.Version'),
      cell: ({ row }) => <span className="font-mono text-sm">v{row.original.version}</span>,
    },
    {
      id: 'lifecycleStatus',
      accessorKey: 'lifecycleStatus',
      header: t('Privacy.LegalDocuments.Columns.Status'),
      cell: ({ row }) => <LegalDocumentStatusBadge status={row.original.lifecycleStatus} />,
    },
    {
      id: 'lastModifiedAt',
      accessorKey: 'lastModifiedAt',
      header: t('Privacy.LegalDocuments.Columns.LastModified'),
      cell: ({ row }) => formatDateTime(row.original.lastModifiedAt),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const doc = row.original;
        const isDraft = doc.lifecycleStatus === 'Draft';

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">{t('Common.Actions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onViewVersions(doc.documentId)}>
                {t('Privacy.LegalDocuments.ViewVersions')}
              </DropdownMenuItem>
              {canManage && isDraft && (
                <DropdownMenuItem onClick={() => actions.onEdit(doc.id)}>
                  {t('Privacy.LegalDocuments.Edit')}
                </DropdownMenuItem>
              )}
              {canManage && isDraft && (
                <DropdownMenuItem onClick={() => actions.onPublish(doc)}>
                  {t('Privacy.LegalDocuments.Publish')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
