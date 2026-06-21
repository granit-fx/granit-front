import { useApplyAdminDebit } from '@granit/react-customer-balance';
import { useTranslation } from '@granit/react-localization';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from '@granit/react-ui';
import { FormDialog } from '@granit/react-ui-admin-kit';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type { AdminDebitRequest } from '@granit/customer-balance';
import type { CurrencyCode } from '@granit/types';

// Mirrors the API DTO, but the optional reference fields are always-present
// strings in the form and are coerced to null (when empty) on submit.
type ApplyDebitFormValues = Omit<AdminDebitRequest, 'referenceId' | 'referenceType'> & {
  referenceId: string;
  referenceType: string;
};

interface ApplyDebitDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly defaultCurrency?: string;
}

export function ApplyDebitDialog({
  open,
  onOpenChange,
  defaultCurrency = 'EUR',
}: ApplyDebitDialogProps) {
  const { t } = useTranslation();
  const mutation = useApplyAdminDebit();

  const form = useForm<ApplyDebitFormValues>({
    defaultValues: {
      partyId: '',
      amount: 0,
      currency: defaultCurrency,
      reason: '',
      referenceId: '',
      referenceType: '',
    },
  });

  // Reset to a clean form whenever the dialog closes, so a reopen starts fresh
  // (replaces the previous remount-on-open gate).
  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  async function onSubmit(values: ApplyDebitFormValues) {
    try {
      await mutation.mutateAsync({
        partyId: values.partyId,
        amount: values.amount,
        currency: values.currency as CurrencyCode,
        reason: values.reason,
        referenceId: values.referenceId || null,
        referenceType: values.referenceType || null,
      });
      toast.success(t('CustomerBalance.DebitSuccess'));
      handleOpenChange(false);
    } catch {
      // API errors are surfaced by the global MutationCache.onError toast.
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      form={form}
      onSubmit={onSubmit}
      title={t('CustomerBalance.ApplyDebit')}
      description={t('CustomerBalance.ApplyDebitDescription')}
      submitLabel={t('CustomerBalance.ApplyDebit')}
      busyLabel={t('CustomerBalance.Submitting')}
      cancelLabel={t('Common.Cancel')}
      isSubmitting={mutation.isPending}
      submitVariant="destructive"
      data-slot="apply-debit-dialog"
    >
      <FormField
        control={form.control}
        name="partyId"
        rules={{
          required: true,
          pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('CustomerBalance.Fields.PartyId')}</FormLabel>
            <FormControl>
              <Input {...field} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="amount"
        rules={{ required: true, min: 1 }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('CustomerBalance.Fields.Amount')}</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                name={field.name}
                ref={field.ref}
                value={field.value}
                onBlur={field.onBlur}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="currency"
        rules={{ required: true }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('CustomerBalance.Fields.Currency')}</FormLabel>
            <FormControl>
              <Input {...field} placeholder="EUR" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="reason"
        rules={{ required: true }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('CustomerBalance.Fields.Reason')}</FormLabel>
            <FormControl>
              <Textarea {...field} rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="referenceId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('CustomerBalance.Fields.ReferenceId')}</FormLabel>
            <FormControl>
              <Input {...field} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="referenceType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('CustomerBalance.Fields.ReferenceType')}</FormLabel>
            <FormControl>
              <Input {...field} placeholder="AdminAdjustment" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
