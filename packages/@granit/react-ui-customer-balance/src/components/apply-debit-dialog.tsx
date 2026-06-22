import { customerBalanceConstraints } from '@granit/customer-balance';
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
import { createConstraintsResolver } from '@granit/react-validation';
import { useForm, type Resolver } from 'react-hook-form';
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

  // Field labels feed the `{PropertyName}` placeholder of the shared
  // `Validation:Builtin:*` messages — owned by the backend `Granit.Validation`
  // package (namespace `Validation`), which the host app must load via the
  // Localization API. The front never redefines these keys.
  const fieldLabels: Record<string, string> = {
    partyId: t('CustomerBalance.Fields.PartyId'),
    amount: t('CustomerBalance.Fields.Amount'),
    currency: t('CustomerBalance.Fields.Currency'),
    reason: t('CustomerBalance.Fields.Reason'),
    referenceId: t('CustomerBalance.Fields.ReferenceId'),
    referenceType: t('CustomerBalance.Fields.ReferenceType'),
  };

  const form = useForm<ApplyDebitFormValues>({
    // Cast: the structural resolver from @granit/react-validation has no
    // react-hook-form peer dep, so its type needs widening to RHF's Resolver.
    resolver: createConstraintsResolver(customerBalanceConstraints.AdminDebitRequest, t, {
      labelResolver: (field) => fieldLabels[field] ?? field,
    }) as unknown as Resolver<ApplyDebitFormValues>,
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

  function onSubmit(values: ApplyDebitFormValues) {
    // `mutate` (not `mutateAsync`) routes failures to the global
    // MutationCache.onError toast — no local catch needed.
    mutation.mutate(
      {
        partyId: values.partyId,
        amount: values.amount,
        currency: values.currency as CurrencyCode,
        reason: values.reason,
        referenceId: values.referenceId || null,
        referenceType: values.referenceType || null,
      },
      {
        onSuccess: () => {
          toast.success(t('CustomerBalance.DebitSuccess'));
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
