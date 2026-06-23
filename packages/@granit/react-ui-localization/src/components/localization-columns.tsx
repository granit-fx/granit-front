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

import type { LocalizationOverride } from '@granit/localization';
import type { useTranslation } from '@granit/react-localization';
import type { ColumnDef } from '@tanstack/react-table';

type TranslateFn = ReturnType<typeof useTranslation>['t'];

interface LocalizationColumnOptions {
  readonly t: TranslateFn;
  readonly onEdit: (override: LocalizationOverride) => void;
  readonly onDelete: (override: LocalizationOverride) => void;
}

const CULTURE_FLAGS: Record<string, string> = {
  fr: '🇫🇷',
  'fr-CA': '🇨🇦',
  en: '🇺🇸',
  'en-US': '🇺🇸',
  'en-GB': '🇬🇧',
  nl: '🇳🇱',
  de: '🇩🇪',
  es: '🇪🇸',
  it: '🇮🇹',
  pt: '🇵🇹',
};

const MODULE_COLORS: Record<string, string> = {
  Granit: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25',
  Showcase: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
};

export function createLocalizationColumns({
  t,
  onEdit,
  onDelete,
}: LocalizationColumnOptions): ColumnDef<LocalizationOverride, unknown>[] {
  return [
    {
      id: 'resourceName',
      accessorKey: 'resourceName',
      header: t('Localization.Columns.ResourceName'),
      enableSorting: true,
      cell: ({ row }) => {
        const name = row.original.resourceName;
        return (
          <Badge
            variant="outline"
            className={cn('text-xs', MODULE_COLORS[name] ?? 'bg-muted/50 text-muted-foreground')}
          >
            {name}
          </Badge>
        );
      },
    },
    {
      id: 'cultureName',
      accessorKey: 'cultureName',
      header: t('Localization.Columns.CultureName'),
      enableSorting: true,
      cell: ({ row }) => {
        const culture = row.original.cultureName;
        const flag = CULTURE_FLAGS[culture] ?? '🌐';
        return (
          <span className="text-sm text-muted-foreground">
            {flag} {culture}
          </span>
        );
      },
    },
    {
      id: 'key',
      accessorKey: 'key',
      header: t('Localization.Columns.Key'),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-foreground">{row.original.key}</span>
      ),
    },
    {
      id: 'value',
      accessorKey: 'value',
      header: t('Localization.Columns.Value'),
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.value}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const override = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Actions for ${override.key}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(override)}>
                {t('Common.Edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(override)} className="text-alert-600">
                {t('Localization.Actions.DeleteOverride')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
