// ---------------------------------------------------------------------------
// SortableHeader — column header with sort indicator
// ---------------------------------------------------------------------------

import type { SortDirection } from '@granit/query-engine';
import { Button } from '@granit/react-ui';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react';

const SORT_ICONS: Record<string, typeof ArrowUpIcon> = {
  asc: ArrowUpIcon,
  desc: ArrowDownIcon,
};

export interface SortableHeaderProps {
  /** Column label. */
  readonly label: string;
  /** Current sort direction (undefined = not sorted). */
  readonly direction?: SortDirection;
  /** Callback when header is clicked. */
  readonly onToggle: () => void;
  /** CSS class. */
  readonly className?: string;
}

/**
 * Table column header with sort toggle button and direction indicator.
 */
export function SortableHeader({
  label,
  direction,
  onToggle,
  className,
}: Readonly<SortableHeaderProps>) {
  const Icon = (direction && SORT_ICONS[direction]) ?? ArrowUpDownIcon;

  return (
    <Button
      variant="ghost"
      size="sm"
      data-slot="sortable-header"
      data-sort-direction={direction}
      className={className}
      onClick={onToggle}
    >
      {label}
      <Icon className="ml-1 size-3.5" />
    </Button>
  );
}
