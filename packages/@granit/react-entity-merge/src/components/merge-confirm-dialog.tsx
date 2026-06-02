/** Localized labels for {@link MergeConfirmDialog}. */
export interface MergeConfirmDialogLabels {
  readonly title: string;
  /** Body copy — should warn that a merge is irreversible (soft-archive only). */
  readonly body: string;
  readonly confirm: string;
  readonly cancel: string;
}

export interface MergeConfirmDialogProps {
  readonly open: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly labels: MergeConfirmDialogLabels;
  /** Disables the confirm button while the merge request is in flight. */
  readonly isPending?: boolean;
}

/**
 * Minimal headless confirmation step for a live merge. Renders nothing when
 * `open` is `false`. Consumers that already have a design-system dialog can
 * ignore this and call the mutation directly — it exists so headless callers
 * get an accessible confirm/cancel surface with an irreversibility warning.
 */
export function MergeConfirmDialog({
  open,
  onConfirm,
  onCancel,
  labels,
  isPending = false,
}: Readonly<MergeConfirmDialogProps>) {
  if (!open) return null;
  return (
    <dialog
      open
      aria-label={labels.title}
      data-slot="merge-confirm-dialog"
      className="space-y-4 rounded-md border bg-card p-4 text-card-foreground"
    >
      <h2 className="text-lg font-semibold">{labels.title}</h2>
      <p className="text-sm text-muted-foreground">{labels.body}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium"
        >
          {labels.cancel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
        >
          {labels.confirm}
        </button>
      </div>
    </dialog>
  );
}
