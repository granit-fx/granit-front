// ---------------------------------------------------------------------------
// GroupBySelector — dropdown for selecting group-by field (Story #54)
// ---------------------------------------------------------------------------

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
} from '@granit/react-ui';
import { ChevronDownIcon, GroupIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ColumnDefinition, GroupByField } from '@granit/query-engine';

export interface GroupBySelectorProps {
  /** Available group-by fields from metadata. */
  readonly fields: readonly GroupByField[];
  /** Column definitions to resolve display labels. */
  readonly columns?: readonly ColumnDefinition[];
  /** Currently selected group-by field. */
  readonly value?: string;
  /** Callback when group-by changes. */
  readonly onValueChange: (field: string | undefined) => void;
  /** CSS class for the root container. */
  readonly className?: string;
}

/**
 * Dropdown menu for selecting a group-by field.
 *
 * @example
 * ```tsx
 * <GroupBySelector
 *   fields={meta.groupByFields}
 *   value={params.groupBy}
 *   onValueChange={setGroupBy}
 * />
 * ```
 */
export function GroupBySelector({
  fields,
  columns,
  value,
  onValueChange,
  className,
}: Readonly<GroupBySelectorProps>) {
  const { t } = useTranslation();
  const label = t('Common.GroupBy', 'Group by');

  const resolveLabel = (name: string) => columns?.find((c) => c.name === name)?.label ?? name;

  if (fields.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={value ? 'default' : 'outline'}
          size="sm"
          data-slot="group-by-selector"
          className={className}
        >
          <GroupIcon className="mr-1.5 size-4" />
          {value ? `${label} : ${resolveLabel(value)}` : label}
          <ChevronDownIcon className="ml-1.5 size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {value && (
          <>
            <DropdownMenuItem onClick={() => onValueChange(undefined)}>
              {t('Common.NoGrouping', 'No grouping')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {fields.map((field) => (
          <DropdownMenuItem
            key={field.name}
            data-active={field.name === value}
            onClick={() => onValueChange(field.name)}
          >
            {resolveLabel(field.name)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
