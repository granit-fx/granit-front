import { customerBalanceConstraints } from '@granit/customer-balance';
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
  toast,
} from '@granit/react-ui';
import { FormDialog } from '@granit/react-ui-kit';
import { createConstraintsResolver } from '@granit/react-validation';
import { toISODateString } from '@granit/types';
import { useForm, type Resolver } from 'react-hook-form';

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

  // Field labels feed the `{PropertyName}` placeholder of the shared
  // `Validation:Builtin:*` messages — owned by the backend `Granit.Validation`
  // package (namespace `Validation`), which the host app must load via the
  // Localization API. The front never redefines these keys.
  const fieldLabels: Record<string, string> = {
    partyId: t('CustomerBalance.Fields.PartyId'),
    amount: t('CustomerBalance.Fields.Amount'),
    currency: t('CustomerBalance.Fields.Currency'),
    source: t('CustomerBalance.Fields.Source'),
    reason: t('CustomerBalance.Fields.Reason'),
    expiresAt: t('CustomerBalance.Fields.ExpiresAt'),
  };

  const form = useForm<AddCreditFormValues>({
    // Cast: the structural resolver from @granit/react-validation has no
    // react-hook-form peer dep, so its type needs widening to RHF's Resolver.
    resolver: createConstraintsResolver(customerBalanceConstraints.AdminCreditRequest, t, {
      labelResolver: (field) => fieldLabels[field] ?? field,
    }) as unknown as Resolver<AddCreditFormValues>,
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

  function onSubmit(values: AddCreditFormValues) {
    // `mutate` (not `mutateAsync`) routes failures to the global
    // MutationCache.onError toast — no local catch needed.
    mutation.mutate(
      {
        partyId: values.partyId,
        amount: values.amount,
        currency: values.currency as CurrencyCode,
        source: values.source,
        reason: values.reason,
        expiresAt: values.expiresAt ? toISODateString(values.expiresAt) : null,
      },
      {
        onSuccess: () => {
          toast.success(t('CustomerBalance.CreditSuccess'));
          handleOpenChange(false);
        },
      }
    );
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
