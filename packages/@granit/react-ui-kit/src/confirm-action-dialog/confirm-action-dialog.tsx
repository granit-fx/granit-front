import { useTranslation } from '@granit/react-localization';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@granit/react-ui';

import type { ReactNode } from 'react';

export interface ConfirmActionDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** Label of the confirming action button. */
  readonly confirmLabel: ReactNode;
  /** Confirm label shown while {@link isPending}; falls back to {@link confirmLabel}. */
  readonly busyLabel?: ReactNode;
  /** Defaults to the translated `Common.Cancel`. */
  readonly cancelLabel?: ReactNode;
  /** Invoked when the user confirms. Owns the mutation/side-effect and dialog close. */
  readonly onConfirm: () => void;
  /** Disables both buttons and swaps the confirm label for {@link busyLabel}. */
  readonly isPending?: boolean;
  /** `destructive` styles the confirm button for irreversible actions (delete, revoke…). */
  readonly tone?: 'default' | 'destructive';
  readonly className?: string;
  readonly 'data-slot'?: string;
}

/**
 * Shared shell for the confirm-an-action pattern: a titled `AlertDialog` with a
 * Cancel/Confirm footer. Callers own the action (mutation, toast, dialog close)
 * via {@link ConfirmActionDialogProps.onConfirm} and pass the labels — only the
 * repeated chrome lives here. Mirrors {@link FormDialog} for the form case.
 *
 * @example
 * ```tsx
 * const revoke = useRevokeApiKey();
 * <ConfirmActionDialog
 *   open={open}
 *   onOpenChange={onOpenChange}
 *   tone="destructive"
 *   title={t('ApiKeys.ConfirmRevoke')}
 *   description={t('ApiKeys.ConfirmRevokeDescription', { name })}
 *   confirmLabel={t('ApiKeys.ConfirmRevoke')}
 *   isPending={revoke.isPending}
 *   onConfirm={() => revoke.mutate(id, { onSuccess: () => onOpenChange(false) })}
 * />
 * ```
 */
export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  busyLabel,
  cancelLabel,
  onConfirm,
  isPending = false,
  tone = 'default',
  className,
  'data-slot': dataSlot = 'confirm-action-dialog',
}: ConfirmActionDialogProps) {
  const { t } = useTranslation();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-slot={dataSlot} className={className}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description !== undefined && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {cancelLabel ?? t('Common.Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className={
              tone === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : undefined
            }
          >
            {isPending ? (busyLabel ?? confirmLabel) : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
