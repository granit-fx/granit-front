import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@granit/react-ui';
import { cn } from '@granit/utils';
import { MoreHorizontal } from 'lucide-react';

import type { ReferenceDataEntry } from './types';
import type { useTranslation } from '@granit/react-localization';
import type { DataTableColumnDef } from '@granit/react-ui-kit';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface ReferenceDataColumnOptions {
  readonly t: TranslateFn;
  readonly i18nPrefix?: string;
  readonly onEdit: (code: string) => void;
  readonly onDeactivate: (entry: ReferenceDataEntry) => void;
  readonly onReactivate: (entry: ReferenceDataEntry) => void;
}

export function createReferenceDataColumns({
  t,
  i18nPrefix = 'ReferenceData.Common',
  onEdit,
  onDeactivate,
  onReactivate,
}: ReferenceDataColumnOptions): DataTableColumnDef<ReferenceDataEntry, unknown>[] {
  return [
    {
      id: 'code',
      accessorKey: 'code',
      header: t(`${i18nPrefix}.Columns.Code`),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-foreground">{row.original.code}</span>
      ),
    },
    {
      id: 'labelEn',
      accessorKey: 'labelEn',
      header: t(`${i18nPrefix}.Columns.LabelEn`),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.labelEn}</span>
      ),
    },
    {
      id: 'activated',
      accessorKey: 'activated',
      header: t(`${i18nPrefix}.Columns.Active`),
      enableSorting: false,
      cell: ({ row }) => {
        const active = row.original.activated;
        return (
          <Badge
            variant={active ? 'default' : 'secondary'}
            className={cn(
              'text-xs',
              active
                ? 'bg-success-500/15 text-success border-success-500/25'
                : 'bg-muted/50 text-muted-foreground'
            )}
          >
            {active ? t(`${i18nPrefix}.Status.Active`) : t(`${i18nPrefix}.Status.Inactive`)}
          </Badge>
        );
      },
    },
    {
      id: 'metadata',
      accessorKey: 'metadata',
      header: t(`${i18nPrefix}.Columns.Metadata`),
      enableSorting: false,
      cell: ({ row }) => {
        const props = row.original.metadata;
        if (!props || Object.keys(props).length === 0) {
          return <span className="text-xs text-muted-foreground/50">&mdash;</span>;
        }
        const entries = Object.entries(props);
        return (
          <div className="flex flex-wrap gap-1">
            {entries.slice(0, 2).map(([key, value]) => (
              <Badge key={key} variant="outline" className="text-[10px] font-normal">
                {key}: {value}
              </Badge>
            ))}
            {entries.length > 2 && (
              <Badge variant="outline" className="text-[10px] font-normal">
                +{entries.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const entry = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={t(`${i18nPrefix}.Actions.Menu`, { name: entry.labelEn })}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(entry.code)}>
                {t(`${i18nPrefix}.Actions.Edit`)}
              </DropdownMenuItem>
              {entry.activated ? (
                <DropdownMenuItem onClick={() => onDeactivate(entry)} className="text-alert-600">
                  {t(`${i18nPrefix}.Actions.Deactivate`)}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onReactivate(entry)}>
                  {t(`${i18nPrefix}.Actions.Reactivate`)}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
