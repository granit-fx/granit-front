import { AI_WORKSPACE_KINDS } from '@granit/ai';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@granit/react-ui';
import { MoreHorizontal } from 'lucide-react';

import type { AIWorkspaceResponse } from '@granit/ai';
import type { useTranslation } from '@granit/react-localization';
import type { DataTableColumnDef } from '@granit/react-ui-kit';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface WorkspaceColumnOptions {
  readonly t: TranslateFn;
  readonly onView: (ws: AIWorkspaceResponse) => void;
  readonly onEdit: (ws: AIWorkspaceResponse) => void;
  readonly onDelete: (ws: AIWorkspaceResponse) => void;
  readonly canManage: boolean;
}

export function createWorkspaceColumns({
  t,
  onView,
  onEdit,
  onDelete,
  canManage,
}: WorkspaceColumnOptions): DataTableColumnDef<AIWorkspaceResponse, unknown>[] {
  return [
    {
      id: 'key',
      accessorKey: 'key',
      header: t('AI.Workspaces.Form.Key'),
      cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.original.key}</span>,
    },
    {
      id: 'provider',
      accessorKey: 'provider',
      header: t('AI.Workspaces.Form.ProviderName'),
    },
    {
      id: 'model',
      accessorKey: 'model',
      header: t('AI.Workspaces.Form.Model'),
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.model}</span>,
    },
    {
      id: 'kind',
      accessorKey: 'kind',
      header: t('AI.Workspaces.Columns.Kind'),
      cell: ({ row }) => {
        const isSystem = row.original.kind === AI_WORKSPACE_KINDS.SYSTEM;
        return (
          <Badge variant={isSystem ? 'outline' : 'secondary'}>
            {isSystem ? t('AI.Workspaces.Kind.System') : t('AI.Workspaces.Kind.Dynamic')}
          </Badge>
        );
      },
    },
    {
      id: 'activated',
      accessorKey: 'activated',
      header: t('AI.Workspaces.Form.Status'),
      cell: ({ row }) => (
        <Badge variant={row.original.activated ? 'default' : 'secondary'}>
          {row.original.activated ? t('Common.Enabled') : t('Common.Disabled')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const ws = row.original;
        const isSystem = ws.kind === AI_WORKSPACE_KINDS.SYSTEM;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Actions for ${ws.key}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isSystem || !canManage ? (
                <DropdownMenuItem onClick={() => onView(ws)}>{t('Common.View')}</DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onEdit(ws)}>{t('Common.Edit')}</DropdownMenuItem>
              )}
              {!isSystem && canManage && (
                <DropdownMenuItem onClick={() => onDelete(ws)} className="text-destructive">
                  {t('Common.Delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
