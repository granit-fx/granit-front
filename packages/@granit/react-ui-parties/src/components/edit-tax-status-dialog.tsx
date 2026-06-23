import { useTranslation } from '@granit/react-localization';
import { useSetPartyTaxStatusMutation } from '@granit/react-parties';
import {
  Checkbox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  toast,
} from '@granit/react-ui';
import { FormDialog } from '@granit/react-ui-admin-kit';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { logger } from '../logger';
import { partyTaxStatusSchema, type PartyTaxStatusFormValues } from '../validation';

import type { PartyId, PartyTaxStatusResponse } from '@granit/parties';

interface EditTaxStatusDialogProps {
  readonly partyId: PartyId;
  readonly current: PartyTaxStatusResponse;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function EditTaxStatusDialog({
  partyId,
  current,
  open,
  onOpenChange,
}: EditTaxStatusDialogProps) {
  const { t } = useTranslation();
  const mutation = useSetPartyTaxStatusMutation();

  const form = useForm<PartyTaxStatusFormValues>({
    resolver: zodResolver(partyTaxStatusSchema(t)),
    defaultValues: {
      isExempt: current.isExempt,
      reverseCharge: current.reverseCharge,
      vatin: current.vatin ?? null,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        isExempt: current.isExempt,
        reverseCharge: current.reverseCharge,
        vatin: current.vatin ?? null,
      });
    }
  }, [open, current, form]);

  const handleSubmit = async (values: PartyTaxStatusFormValues) => {
    try {
      await mutation.mutateAsync({
        id: partyId,
        request: {
          isExempt: values.isExempt,
          reverseCharge: values.reverseCharge,
          vatin: values.vatin ?? null,
          evidenceBlobId: null,
        },
      });
      toast.success(t('Parties.TaxStatus.SaveSuccess'));
      onOpenChange(false);
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[EditTaxStatusDialog] set tax status failed', err);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={handleSubmit}
      title={t('Parties.TaxStatus.EditTitle')}
      description={t('Parties.TaxStatus.EditDescription')}
      submitLabel={t('Common.Save')}
      busyLabel={t('Common.Loading')}
      cancelLabel={t('Common.Cancel')}
      isSubmitting={mutation.isPending}
      data-slot="edit-tax-status-dialog"
    >
      <FormField
        control={form.control}
        name="isExempt"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start gap-2 space-y-0">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-0.5">
              <FormLabel className="!mt-0">{t('Parties.TaxStatus.IsExempt')}</FormLabel>
              <p className="text-xs text-muted-foreground">{t('Parties.TaxStatus.IsExemptHint')}</p>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="reverseCharge"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start gap-2 space-y-0">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-0.5">
              <FormLabel className="!mt-0">{t('Parties.TaxStatus.ReverseCharge')}</FormLabel>
              <p className="text-xs text-muted-foreground">
                {t('Parties.TaxStatus.ReverseChargeHint')}
              </p>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="vatin"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('Parties.Fields.Vatin')}</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} placeholder="BE0123456789" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
