import { useTranslation } from '@granit/react-localization';
import { toast } from '@granit/react-ui';
import { FormDialog } from '@granit/react-ui-kit';

import { logger } from '../logger';

import type { ReactNode } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

export interface PartyAddDialogProps<TValues extends FieldValues> {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly form: UseFormReturn<TValues>;
  /** Performs the mutation; rejection is swallowed (surfaced by the global toast). */
  readonly submit: (values: TValues) => Promise<unknown>;
  readonly isPending: boolean;
  /** Translation key for the success toast shown after {@link submit} resolves. */
  readonly successKey: string;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly 'data-slot': string;
  readonly children: ReactNode;
}

/**
 * Shared shell for the "add sub-resource to a party" dialogs (phone, email,
 * address, external mapping): wraps {@link FormDialog} with the constant Add /
 * Loading labels and the identical submit lifecycle — await the mutation, toast
 * success, reset the form, close. Each caller keeps ownership of its schema,
 * mutation and fields. Parties-internal: depends only on the neutral FormDialog,
 * never on another feature.
 */
export function PartyAddDialog<TValues extends FieldValues>({
  open,
  onOpenChange,
  form,
  submit,
  isPending,
  successKey,
  title,
  description,
  'data-slot': dataSlot,
  children,
}: PartyAddDialogProps<TValues>) {
  const { t } = useTranslation();

  const handleSubmit = async (values: TValues) => {
    try {
      await submit(values);
      toast.success(t(successKey));
      form.reset();
      onOpenChange(false);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[PartyAddDialog] submit failed', err);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={handleSubmit}
      title={title}
      description={description}
      submitLabel={t('Common.Add')}
      busyLabel={t('Common.Loading')}
      isSubmitting={isPending}
      data-slot={dataSlot}
    >
      {children}
    </FormDialog>
  );
}
