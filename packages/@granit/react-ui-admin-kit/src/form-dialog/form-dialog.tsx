import type { ReactNode } from 'react';

import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
} from '@granit/react-ui';

import type { FieldValues, UseFormReturn } from 'react-hook-form';

export interface FormDialogProps<TValues extends FieldValues> {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** The `react-hook-form` instance driving the body fields. */
  readonly form: UseFormReturn<TValues>;
  readonly onSubmit: (values: TValues) => void | Promise<void>;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** The form fields, rendered inside the shared `<Form>`/`<form>` wrapper. */
  readonly children: ReactNode;
  readonly submitLabel: ReactNode;
  /** Submit label shown while {@link isSubmitting}; falls back to `submitLabel`. */
  readonly busyLabel?: ReactNode;
  /** Defaults to the translated `Common.Cancel`. */
  readonly cancelLabel?: ReactNode;
  readonly isSubmitting?: boolean;
  readonly submitVariant?: 'default' | 'destructive';
  readonly className?: string;
  readonly 'data-slot'?: string;
}

/**
 * Shared shell for the form-in-a-dialog pattern: a titled dialog wrapping a
 * `react-hook-form` `<form>` with a Cancel/Submit footer. Callers supply the
 * fields as children and keep ownership of the form instance, mutation, and
 * submit handler — only the repeated chrome lives here. Neutral location
 * (`src/components/`) so any feature can use it without depending on another.
 */
export function FormDialog<TValues extends FieldValues>({
  open,
  onOpenChange,
  form,
  onSubmit,
  title,
  description,
  children,
  submitLabel,
  busyLabel,
  cancelLabel,
  isSubmitting = false,
  submitVariant = 'default',
  className,
  'data-slot': dataSlot = 'form-dialog',
}: FormDialogProps<TValues>) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot={dataSlot} className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description !== undefined && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {children}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {cancelLabel ?? t('Common.Cancel')}
              </Button>
              <Button type="submit" variant={submitVariant} disabled={isSubmitting}>
                {isSubmitting ? (busyLabel ?? submitLabel) : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
