import { paymentsConstraints } from '@granit/payments';
import { useTranslation } from '@granit/react-localization';
import { useInitiatePaymentCharge } from '@granit/react-payments';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  toast,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { toEntityId } from '@granit/types';
import { useForm, type Resolver } from 'react-hook-form';

import type { CurrencyCode } from '@granit/types';

interface ChargeFormValues {
  invoiceId: string;
  partyId: string;
  amount: number;
  currency: string;
  methodType: string;
  providerName: string;
}

interface ChargeDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

/** Title-cases a form field name to match the `Payments.Fields.*` key suffix. */
function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ChargeDialog({ open, onOpenChange }: ChargeDialogProps) {
  const { t } = useTranslation();
  const mutation = useInitiatePaymentCharge();

  // Spec-derived validation: the resolver checks each registered field against
  // the OpenAPI-backed PaymentChargeRequest constraints. Labels map to the
  // `Payments.Fields.*` keys via the field-name capitalisation.
  const formResolver = createConstraintsResolver(paymentsConstraints.PaymentChargeRequest, t, {
    labelResolver: (field) => t(`Payments.Fields.${capitalize(field)}`, field),
  }) as unknown as Resolver<ChargeFormValues>;

  const form = useForm<ChargeFormValues>({
    resolver: formResolver,
    defaultValues: {
      invoiceId: '',
      partyId: '',
      amount: 0,
      currency: 'EUR',
      methodType: '',
      providerName: '',
    },
  });

  function onSubmit(values: ChargeFormValues) {
    mutation.mutate(
      {
        invoiceId: toEntityId<'Invoice'>(values.invoiceId),
        partyId: toEntityId<'Party'>(values.partyId),
        amount: values.amount,
        currency: values.currency as CurrencyCode,
        methodType: values.methodType,
        providerName: values.providerName || null,
      },
      {
        onSuccess: () => {
          // API errors are surfaced by the global MutationCache.onError toast.
          toast.success(t('Payments.Charge.Success'));
          form.reset();
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="charge-dialog">
        <DialogHeader>
          <DialogTitle>{t('Payments.Charge.Title')}</DialogTitle>
          <DialogDescription>{t('Payments.Charge.Description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="invoiceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Payments.Fields.InvoiceId')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="partyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Payments.Fields.PartyId')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>{t('Payments.Fields.Amount')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      onChange={(e) => field.onChange(Number(e.target.value))}
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
                  <FormLabel>{t('Payments.Fields.Currency')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="EUR" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="methodType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Payments.Fields.MethodType')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Card" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="providerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Payments.Fields.ProviderName')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Stripe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                {t('Common.Cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? t('Common.Loading') : t('Payments.Charge.Submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
