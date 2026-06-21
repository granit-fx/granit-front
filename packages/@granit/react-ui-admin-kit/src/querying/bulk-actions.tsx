// ---------------------------------------------------------------------------
// BulkActions — selection toolbar for batch operations (Story #56)
// ---------------------------------------------------------------------------

import { useTranslation } from '@granit/react-localization';
import { Button, Checkbox } from '@granit/react-ui';

import type { ReactNode } from 'react';

export interface BulkAction {
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  readonly onAction: (selectedIds: readonly string[]) => void;
}

export interface BulkActionsProps {
  /** Total number of items (for "select all" display). */
  readonly totalCount: number;
  /** Currently selected item IDs. */
  readonly selectedIds: readonly string[];
  /** Callback when selection changes. */
  readonly onSelectionChange: (ids: readonly string[]) => void;
  /** All visible item IDs (for "select all visible"). */
  readonly visibleIds: readonly string[];
  /** Available bulk actions. */
  readonly actions: readonly BulkAction[];
  /** CSS class. */
  readonly className?: string;
}

/**
 * Toolbar that appears when items are selected, with bulk action buttons.
 *
 * @example
 * ```tsx
 * <BulkActions
 *   totalCount={100}
 *   selectedIds={selectedIds}
 *   onSelectionChange={setSelectedIds}
 *   visibleIds={data.map(d => d.id)}
 *   actions={[
 *     { id: 'delete', label: 'Delete', variant: 'destructive', onAction: handleDelete },
 *   ]}
 * />
 * ```
 */
export function BulkActions({
  totalCount,
  selectedIds,
  onSelectionChange,
  visibleIds,
  actions,
  className,
}: Readonly<BulkActionsProps>) {
  const { t } = useTranslation();

  if (selectedIds.length === 0) return null;

  const allVisibleSelected = visibleIds.every((id) => selectedIds.includes(id));

  return (
    <div
      data-slot="bulk-actions"
      className={`flex items-center gap-3 rounded-md border bg-muted/50 px-4 py-2 ${className ?? ''}`}
    >
      <Checkbox
        checked={allVisibleSelected}
        onCheckedChange={(checked) => {
          if (checked) {
            const combined = new Set([...selectedIds, ...visibleIds]);
            onSelectionChange([...combined]);
          } else {
            onSelectionChange(selectedIds.filter((id) => !visibleIds.includes(id)));
          }
        }}
        aria-label={t('Components.Querying.BulkActions.SelectAllVisible')}
      />
      <span className="text-sm text-muted-foreground">
        {t('Components.Querying.BulkActions.SelectedCount', {
          selected: selectedIds.length,
          total: totalCount,
        })}
      </span>
      <div className="flex gap-1.5">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant ?? 'outline'}
            size="sm"
            onClick={() => action.onAction(selectedIds)}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
