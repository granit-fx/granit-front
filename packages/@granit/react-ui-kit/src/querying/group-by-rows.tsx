// ---------------------------------------------------------------------------
// GroupByRows — expandable group rows for grouped results (Story #58)
// ---------------------------------------------------------------------------

import { Badge, TableCell, TableRow } from '@granit/react-ui';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { useCallback, useState } from 'react';

import type { GroupEntry } from '@granit/query-engine';

export interface GroupByRowsProps<T> {
  /** Groups to render. */
  readonly groups: readonly GroupEntry<T>[];
  /** Number of table columns (for colspan). */
  readonly colSpan: number;
  /** Callback to load items for a group (drill-down). */
  readonly onExpand?: (group: GroupEntry<T>) => void;
  /** Render function for items within an expanded group. */
  readonly renderItem?: (item: T, index: number) => React.ReactNode;
  /** CSS class. */
  readonly className?: string;
}

/**
 * Renders group-by rows with expand/collapse support.
 *
 * When a group is expanded, its items are displayed inline.
 * The `onExpand` callback triggers lazy loading of group items.
 *
 * @example
 * ```tsx
 * <GroupByRows
 *   groups={groupedQuery.data?.groups ?? []}
 *   colSpan={columns.length}
 *   onExpand={(group) => loadGroupItems(group)}
 *   renderItem={(patient, i) => <PatientRow key={i} patient={patient} />}
 * />
 * ```
 */
export function GroupByRows<T>({
  groups,
  colSpan,
  onExpand,
  renderItem,
}: Readonly<GroupByRowsProps<T>>) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleGroup = useCallback(
    (group: GroupEntry<T>) => {
      const key = String(group.value);
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
          onExpand?.(group);
        }
        return next;
      });
    },
    [onExpand]
  );

  return (
    <>
      {groups.map((group) => {
        const key = String(group.value);
        const isExpanded = expanded.has(key);

        return (
          <GroupRow
            key={key}
            group={group}
            colSpan={colSpan}
            isExpanded={isExpanded}
            onToggle={() => toggleGroup(group)}
            renderItem={renderItem}
          />
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// GroupRow (internal)
// ---------------------------------------------------------------------------

interface GroupRowProps<T> {
  readonly group: GroupEntry<T>;
  readonly colSpan: number;
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
  readonly renderItem?: (item: T, index: number) => React.ReactNode;
}

function GroupRow<T>({
  group,
  colSpan,
  isExpanded,
  onToggle,
  renderItem,
}: Readonly<GroupRowProps<T>>) {
  const ChevronIcon = isExpanded ? ChevronDownIcon : ChevronRightIcon;

  return (
    <>
      <TableRow
        data-slot="group-by-row"
        data-expanded={isExpanded}
        className="cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        <TableCell colSpan={colSpan}>
          <div className="flex items-center gap-2">
            <ChevronIcon className="size-4" />
            <span className="font-medium">{group.label}</span>
            <Badge variant="secondary">{group.count}</Badge>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && group.items?.map((item, i) => renderItem?.(item, i))}
    </>
  );
}
