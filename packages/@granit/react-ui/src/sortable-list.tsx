'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@granit/utils';
import { GripVerticalIcon, XIcon } from 'lucide-react';

import type { ReactNode } from 'react';

export interface SortableListItem {
  /** Stable identity — used for drag tracking and emitted as the order token. */
  readonly id: string;
  /** Row content (label, badges, …). */
  readonly label: ReactNode;
}

export interface SortableListProps {
  readonly items: readonly SortableListItem[];
  /** Emitted with the full id list in its new order after a drag or keyboard move. */
  readonly onReorder: (orderedIds: string[]) => void;
  /** When set, each row shows a remove button invoking this with the row id. */
  readonly onRemove?: (id: string) => void;
  readonly className?: string;
  /** Accessible label for the drag handle. */
  readonly dragHandleLabel?: string;
  /** Accessible label for the remove button. */
  readonly removeLabel?: string;
}

/**
 * Pure reorder applied on drag end — exported for direct unit testing, since
 * pointer/keyboard drags are not reliably reproducible under jsdom.
 */
export function reorderIds(ids: readonly string[], activeId: string, overId: string): string[] {
  const oldIndex = ids.indexOf(activeId);
  const newIndex = ids.indexOf(overId);
  if (oldIndex < 0 || newIndex < 0) {
    return [...ids];
  }
  return arrayMove([...ids], oldIndex, newIndex);
}

/**
 * Vertical drag-and-drop reorderable list built on `@dnd-kit`. Keyboard-operable
 * (focus a handle, Space to pick up, ↑/↓ to move, Space to drop) for WCAG parity
 * with pointer dragging. Purely controlled: the caller owns the ordered id list
 * and re-renders `items` after `onReorder`.
 */
export function SortableList({
  items,
  onReorder,
  onRemove,
  className,
  dragHandleLabel = 'Reorder',
  removeLabel = 'Remove',
}: SortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const ids = items.map((item) => item.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(reorderIds(ids, String(active.id), String(over.id)));
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul data-slot="sortable-list" className={cn('flex flex-col gap-1', className)}>
          {items.map((item) => (
            <SortableRow
              key={item.id}
              item={item}
              onRemove={onRemove}
              dragHandleLabel={dragHandleLabel}
              removeLabel={removeLabel}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  item,
  onRemove,
  dragHandleLabel,
  removeLabel,
}: {
  readonly item: SortableListItem;
  readonly onRemove?: (id: string) => void;
  readonly dragHandleLabel: string;
  readonly removeLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <li
      ref={setNodeRef}
      data-slot="sortable-item"
      data-dragging={isDragging || undefined}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-sm',
        isDragging && 'opacity-70 shadow-sm'
      )}
    >
      <button
        type="button"
        data-slot="sortable-drag-handle"
        aria-label={dragHandleLabel}
        className="cursor-grab touch-none text-muted-foreground focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-1"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4 shrink-0 opacity-50" />
      </button>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {onRemove ? (
        <button
          type="button"
          data-slot="sortable-remove"
          aria-label={removeLabel}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring shrink-0 focus-visible:outline-none focus-visible:ring-1"
          onClick={() => onRemove(item.id)}
        >
          <XIcon className="size-4 opacity-50" />
        </button>
      ) : null}
    </li>
  );
}
