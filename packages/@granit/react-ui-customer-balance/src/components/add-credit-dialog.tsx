import { useAddAdminCredit } from '@granit/react-customer-balance';
import { useTranslation } from '@granit/react-localization';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@granit/react-ui';
import { FormDialog } from '@granit/react-ui-admin-kit';
import { toISODateString } from '@granit/types';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type { AdminCreditRequest } from '@granit/customer-balance';
import type { CurrencyCode } from '@granit/types';

// Mirrors the API DTO, but `expiresAt` is a `datetime-local` string here and is
// converted to an ISO date (or null) on submit.
type AddCreditFormValues = Omit<AdminCreditRequest, 'expiresAt'> & {
  expiresAt: string;
};

interface AddCreditDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly defaultCurrency?: string;
}

export function AddCreditDialog({
  open,
  onOpenChange,
  defaultCurrency = 'EUR',
}: AddCreditDialogProps) {
  const { t } = useTranslation();
  const mutation = useAddAdminCredit();

  const form = useForm<AddCreditFormValues>({
    defaultValues: {
      partyId: '',
      amount: 0,
      currency: defaultCurrency,
      source: 'Promotional',
      reason: '',
      expiresAt: '',
    },
  });

  // Reset to a clean form whenever the dialog closes, so a reopen starts fresh
  // (replaces the previous remount-on-open gate).
  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  async function onSubmit(values: AddCreditFormValues) {
    try {
      await mutation.mutateAsync({
        partyId: values.partyId,
        amount: values.amount,
        currency: values.currency as CurrencyCode,
        source: values.source,
        reason: values.reason,
        expiresAt: values.expiresAt ? toISODateString(values.expiresAt) : null,
      });
      toast.success(t('CustomerBalance.CreditSuccess'));
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
      title={t('CustomerBalance.AddCredit')}
      description={t('CustomerBalance.AddCreditDescription')}
      submitLabel={t('CustomerBalance.Submit')}
      busyLabel={t('CustomerBalance.Submitting')}
      cancelLabel={t('Common.Cancel')}
      isSubmitting={mutation.isPending}
      data-slot="add-credit-dialog"
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
        name="source"
        rules={{ required: true }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('CustomerBalance.Fields.Source')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('CustomerBalance.Fields.Source')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Promotional">
                  {t('CustomerBalance.Source.Promotional')}
                </SelectItem>
                <SelectItem value="ManualAdjustment">
                  {t('CustomerBalance.Source.ManualAdjustment')}
                </SelectItem>
              </SelectContent>
            </Select>
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
        name="expiresAt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('CustomerBalance.Fields.ExpiresAt')}</FormLabel>
            <FormControl>
              <Input {...field} type="datetime-local" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
