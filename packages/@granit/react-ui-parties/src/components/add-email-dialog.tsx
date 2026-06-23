import { useTranslation } from '@granit/react-localization';
import { useAddPartyEmailMutation } from '@granit/react-parties';
import { CheckboxField, TextField } from '@granit/react-ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { partyEmailSchema, type PartyEmailFormValues } from '../validation';

import { PartyAddDialog } from './party-add-dialog';

import type { PartyId } from '@granit/parties';

interface AddEmailDialogProps {
  readonly partyId: PartyId;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function AddEmailDialog({ partyId, open, onOpenChange }: AddEmailDialogProps) {
  const { t } = useTranslation();
  const mutation = useAddPartyEmailMutation();

  const form = useForm<PartyEmailFormValues>({
    resolver: zodResolver(partyEmailSchema(t)),
    defaultValues: { address: '', label: null, isPrimary: false },
  });

  const submit = (values: PartyEmailFormValues) =>
    mutation.mutateAsync({
      id: partyId,
      request: {
        address: values.address,
        label: values.label ?? null,
        isPrimary: values.isPrimary ?? false,
      },
    });

  return (
    <PartyAddDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      submit={submit}
      isPending={mutation.isPending}
      successKey="Parties.Emails.AddSuccess"
      title={t('Parties.Emails.AddTitle')}
      description={t('Parties.Emails.AddDescription')}
      data-slot="add-email-dialog"
    >
      <TextField
        control={form.control}
        name="address"
        label={t('Parties.Fields.Email')}
        type="email"
      />

      <TextField control={form.control} name="label" label={t('Parties.Fields.Label')} />

      <CheckboxField
        control={form.control}
        name="isPrimary"
        label={t('Parties.Fields.IsPrimary')}
      />
    </PartyAddDialog>
  );
}
