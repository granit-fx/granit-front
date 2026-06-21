// ---------------------------------------------------------------------------
// SortSelector — dropdown for selecting sort field and direction
// ---------------------------------------------------------------------------

import type { ColumnDefinition, SortEntry } from '@granit/query-engine';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@granit/react-ui';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, ChevronDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface SortSelectorProps {
  /** Column definitions (only isSortable columns are shown). */
  readonly columns: readonly ColumnDefinition[];
  /** Current sort entries. */
  readonly sort?: readonly SortEntry[];
  /** Callback when a sort field is toggled. */
  readonly onToggleSort: (field: string) => void;
  /** CSS class for the root container. */
  readonly className?: string;
}

/**
 * Dropdown menu for selecting sort field and toggling direction.
 *
 * Displays sortable columns from metadata. Clicking a field cycles
 * through: asc → desc → unsorted.
 */
export function SortSelector({
  columns,
  sort,
  onToggleSort,
  className,
}: Readonly<SortSelectorProps>) {
  const { t } = useTranslation();

  const sortableColumns = columns.filter((c) => c.isSortable);
  if (sortableColumns.length === 0) return null;

  const currentSort = sort?.[0];
  const currentLabel = currentSort
    ? (columns.find((c) => c.name === currentSort.field)?.label ?? currentSort.field)
    : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={currentSort ? 'default' : 'outline'}
          size="sm"
          data-slot="sort-selector"
          className={className}
        >
          {currentSort?.direction === 'asc' && <ArrowUpIcon className="mr-1.5 size-4" />}
          {currentSort?.direction === 'desc' && <ArrowDownIcon className="mr-1.5 size-4" />}
          {!currentSort && <ArrowUpDownIcon className="mr-1.5 size-4" />}
          {currentSort ? `${t('Common.Sort', 'Sort')} : ${currentLabel}` : t('Common.Sort', 'Sort')}
          <ChevronDownIcon className="ml-1.5 size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>{t('Common.Sort', 'Sort')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sortableColumns.map((col) => {
          const entry = sort?.find((s) => s.field === col.name);
          return (
            <DropdownMenuItem
              key={col.name}
              data-slot="sort-option"
              data-active={!!entry}
              onClick={() => onToggleSort(col.name)}
            >
              <span className="flex flex-1 items-center justify-between gap-4">
                <span>{col.label}</span>
                {entry &&
                  (entry.direction === 'asc' ? (
                    <ArrowUpIcon className="size-3.5 text-primary" />
                  ) : (
                    <ArrowDownIcon className="size-3.5 text-primary" />
                  ))}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
