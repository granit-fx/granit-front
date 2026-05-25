import { useState } from 'react';

import { useTrashDocument } from '../hooks/use-document-mutations.js';

import type { DocumentResponse } from '@granit/documents';
import type { ReactNode } from 'react';

export interface DocumentsToolbarLabels {
  readonly noSelection?: string;
  readonly oneSelected?: (name: string) => string;
  readonly manySelected?: (count: number) => string;
  readonly clearSelection?: string;
  readonly bulkTrash?: string;
  readonly bulkTrashConfirm?: (count: number) => string;
  readonly bulkTrashConfirmOk?: string;
  readonly bulkTrashCancel?: string;
  readonly inspectorToggle?: string;
}

export interface DocumentsToolbarProps {
  readonly canManage?: boolean;
  readonly selected: ReadonlySet<string>;
  readonly selectedDocs: readonly DocumentResponse[];
  readonly onClearSelection?: () => void;
  /** Optional inspector visibility binding for the explorer header. */
  readonly inspectorVisible?: boolean;
  readonly onToggleInspector?: () => void;
  readonly labels?: DocumentsToolbarLabels;
  readonly className?: string;
  /** Extra trailing actions (e.g. an `<UploadButton />` in the no-selection state). */
  readonly trailing?: ReactNode;
}

const DEFAULT_LABELS: Required<DocumentsToolbarLabels> = {
  noSelection: 'No selection',
  oneSelected: (name) => `Selected: ${name}`,
  manySelected: (count) => `${String(count)} selected`,
  clearSelection: 'Clear selection',
  bulkTrash: 'Move to trash',
  bulkTrashConfirm: (count) => `Move ${String(count)} item(s) to trash?`,
  bulkTrashConfirmOk: 'Confirm',
  bulkTrashCancel: 'Cancel',
  inspectorToggle: 'Toggle inspector',
};

/**
 * Contextual toolbar driven by the active selection. Renders a summary +
 * bulk actions when one or more documents are selected, or just the
 * trailing slot (typically an `<UploadButton />`) otherwise.
 *
 * Bulk trash uses an inline confirmation (no `window.confirm`), and fires
 * the {@link useTrashDocument} mutation sequentially so the query cache is
 * invalidated cleanly per item.
 */
export function DocumentsToolbar({
  canManage = false,
  selected,
  selectedDocs,
  onClearSelection,
  inspectorVisible,
  onToggleInspector,
  labels,
  className,
  trailing,
}: DocumentsToolbarProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const trashDocument = useTrashDocument();
  const [confirmingTrash, setConfirmingTrash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = selected.size;

  async function handleBulkTrash(): Promise<void> {
    setError(null);
    try {
      for (const doc of selectedDocs) {
        await trashDocument.mutateAsync(doc.id);
      }
      onClearSelection?.();
      setConfirmingTrash(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk trash failed.');
    }
  }

  const summary =
    count === 0
      ? labelStrings.noSelection
      : count === 1
        ? labelStrings.oneSelected(selectedDocs[0]?.name ?? '')
        : labelStrings.manySelected(count);

  return (
    <div
      data-granit-documents-toolbar=""
      data-granit-documents-toolbar-selection={count > 0 ? '' : undefined}
      className={className}
    >
      <span data-granit-documents-toolbar-summary="">{summary}</span>

      {count > 0 && (
        <span data-granit-documents-toolbar-actions="">
          {canManage &&
            (confirmingTrash ? (
              <span data-granit-documents-toolbar-confirm="" role="alertdialog">
                <span>{labelStrings.bulkTrashConfirm(count)}</span>
                <button
                  type="button"
                  onClick={() => setConfirmingTrash(false)}
                  disabled={trashDocument.isPending}
                >
                  {labelStrings.bulkTrashCancel}
                </button>
                <button
                  type="button"
                  data-granit-documents-toolbar-confirm-ok=""
                  onClick={() => {
                    void handleBulkTrash();
                  }}
                  disabled={trashDocument.isPending}
                >
                  {labelStrings.bulkTrashConfirmOk}
                </button>
              </span>
            ) : (
              <button
                type="button"
                data-granit-documents-toolbar-trash=""
                onClick={() => setConfirmingTrash(true)}
              >
                {labelStrings.bulkTrash}
              </button>
            ))}
          {onClearSelection && (
            <button type="button" data-granit-documents-toolbar-clear="" onClick={onClearSelection}>
              {labelStrings.clearSelection}
            </button>
          )}
        </span>
      )}

      {error && (
        <div data-granit-documents-toolbar-error="" role="alert">
          {error}
        </div>
      )}

      <span data-granit-documents-toolbar-trailing="">
        {onToggleInspector && (
          <button
            type="button"
            data-granit-documents-toolbar-inspector-toggle=""
            aria-pressed={inspectorVisible ?? false}
            onClick={onToggleInspector}
          >
            {labelStrings.inspectorToggle}
          </button>
        )}
        {trailing}
      </span>
    </div>
  );
}
