import { paymentsConstraints } from '@granit/payments';
import { useTranslation } from '@granit/react-localization';
import { useRequestPaymentRefund } from '@granit/react-payments';
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
  Textarea,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { toEntityId } from '@granit/types';
import { useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';

interface RefundFormValues {
  amount: number;
  reason: string;
}

interface RefundDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly transactionId: string;
  readonly maxAmount: number;
  readonly currency: string;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount / 100);
}

/** Title-cases a form field name to match the `Payments.Fields.*` key suffix. */
function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function RefundDialog({
  open,
  onOpenChange,
  transactionId,
  maxAmount,
  currency,
}: RefundDialogProps) {
  const { t } = useTranslation();
  const mutation = useRequestPaymentRefund();

  // Spec-derived validation: the resolver checks each registered field (amount,
  // reason) against the OpenAPI-backed PaymentRefundRequest constraints; the
  // request-only transactionId comes from props, not the form. Labels map to the
  // `Payments.Fields.*` keys via the field-name capitalisation.
  const formResolver = createConstraintsResolver(paymentsConstraints.PaymentRefundRequest, t, {
    labelResolver: (field) => t(`Payments.Fields.${capitalize(field)}`, field),
  }) as unknown as Resolver<RefundFormValues>;

  const form = useForm<RefundFormValues>({
    resolver: formResolver,
    defaultValues: {
      amount: maxAmount,
      reason: '',
    },
  });

  function onSubmit(values: RefundFormValues) {
    mutation.mutate(
      {
        transactionId: toEntityId<'PaymentTransaction'>(transactionId),
        amount: values.amount,
        reason: values.reason,
      },
      {
        onSuccess: () => {
          // API errors are surfaced by the global MutationCache.onError toast.
          toast.success(t('Payments.Refund.Success'));
          form.reset();
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="refund-dialog">
        <DialogHeader>
          <DialogTitle>{t('Payments.Refund.Title')}</DialogTitle>
          <DialogDescription>
            {t('Payments.Refund.MaxAmount', { amount: formatCurrency(maxAmount, currency) })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      max={maxAmount}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
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
                  <FormLabel>{t('Payments.Fields.Reason')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
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
              <Button type="submit" variant="destructive" disabled={mutation.isPending}>
                {mutation.isPending ? t('Common.Loading') : t('Payments.Refund.Submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
