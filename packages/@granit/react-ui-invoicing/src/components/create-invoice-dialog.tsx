import { useCreateInvoice } from '@granit/react-invoicing';
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
} from '@granit/react-ui';
import { toISODateString } from '@granit/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { logger } from '../logger';

import type { BillingReason } from '@granit/invoicing';
import type { CurrencyCode } from '@granit/types';

// The create-invoice form validates required identifiers up-front; the enum
// fields are constrained to the backend's accepted literals (they also carry
// sensible defaults). Period bounds are optional ISO datetime-local strings.
const createInvoiceFormSchema = z.object({
  partyId: z.string().min(1),
  currency: z.string().min(1),
  documentType: z.enum(['Invoice', 'CreditNote']),
  collectionMethod: z.enum(['ChargeAutomatically', 'SendInvoice']),
  billingReason: z.string().min(1),
  periodStart: z.string(),
  periodEnd: z.string(),
});

type CreateInvoiceFormValues = z.infer<typeof createInvoiceFormSchema>;

interface CreateInvoiceDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function CreateInvoiceDialog({ open, onOpenChange }: CreateInvoiceDialogProps) {
  const { t } = useTranslation();
  const mutation = useCreateInvoice();

  const form = useForm<CreateInvoiceFormValues>({
    resolver: zodResolver(createInvoiceFormSchema),
    defaultValues: {
      partyId: '',
      currency: 'EUR',
      documentType: 'Invoice',
      collectionMethod: 'ChargeAutomatically',
      billingReason: 'Manual',
      periodStart: '',
      periodEnd: '',
    },
  });

  async function onSubmit(values: CreateInvoiceFormValues) {
    try {
      await mutation.mutateAsync({
        partyId: values.partyId,
        currency: values.currency as CurrencyCode,
        documentType: values.documentType,
        collectionMethod: values.collectionMethod,
        billingReason: values.billingReason as BillingReason,
        parentInvoiceId: null,
        creditNoteReason: null,
        periodStart: values.periodStart ? toISODateString(values.periodStart) : null,
        periodEnd: values.periodEnd ? toISODateString(values.periodEnd) : null,
      });
      toast.success(t('Invoicing.CreateSuccess'));
      form.reset();
      onOpenChange(false);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[CreateInvoiceDialog] Failed to create invoice', err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="create-invoice-dialog" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Invoicing.Create.Title')}</DialogTitle>
          <DialogDescription>{t('Invoicing.Create.Description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="partyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Invoicing.Fields.PartyId')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="party-uuid" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Invoicing.Fields.Currency')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="EUR" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Invoicing.Fields.BillingReason')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SubscriptionCreate">
                          {t('Invoicing.BillingReason.SubscriptionCreate')}
                        </SelectItem>
                        <SelectItem value="SubscriptionCycle">
                          {t('Invoicing.BillingReason.SubscriptionCycle')}
                        </SelectItem>
                        <SelectItem value="SubscriptionUpdate">
                          {t('Invoicing.BillingReason.SubscriptionUpdate')}
                        </SelectItem>
                        <SelectItem value="Manual">
                          {t('Invoicing.BillingReason.Manual')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Invoicing.Fields.DocumentType')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Invoice">
                          {t('Invoicing.DocumentType.Invoice')}
                        </SelectItem>
                        <SelectItem value="CreditNote">
                          {t('Invoicing.DocumentType.CreditNote')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="collectionMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Invoicing.Fields.CollectionMethod')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ChargeAutomatically">
                          {t('Invoicing.CollectionMethod.ChargeAutomatically')}
                        </SelectItem>
                        <SelectItem value="SendInvoice">
                          {t('Invoicing.CollectionMethod.SendInvoice')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="periodStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Invoicing.Fields.PeriodStart')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="periodEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Invoicing.Fields.PeriodEnd')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {mutation.isPending ? t('Common.Loading') : t('Invoicing.Create.Submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
