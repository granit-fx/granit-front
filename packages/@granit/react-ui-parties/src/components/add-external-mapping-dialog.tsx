import { useTranslation } from '@granit/react-localization';
import { useAddPartyExternalMappingMutation } from '@granit/react-parties';
import { TextField } from '@granit/react-ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { partyExternalMappingSchema, type PartyExternalMappingFormValues } from '../validation';

import { PartyAddDialog } from './party-add-dialog';

import type { PartyId } from '@granit/parties';

interface AddExternalMappingDialogProps {
  readonly partyId: PartyId;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function AddExternalMappingDialog({
  partyId,
  open,
  onOpenChange,
}: AddExternalMappingDialogProps) {
  const { t } = useTranslation();
  const mutation = useAddPartyExternalMappingMutation();

  const form = useForm<PartyExternalMappingFormValues>({
    resolver: zodResolver(partyExternalMappingSchema(t)),
    defaultValues: { providerName: '', externalId: '' },
  });

  const submit = (values: PartyExternalMappingFormValues) =>
    mutation.mutateAsync({
      id: partyId,
      request: {
        providerName: values.providerName.toLowerCase(),
        externalId: values.externalId,
      },
    });

  return (
    <PartyAddDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      submit={submit}
      isPending={mutation.isPending}
      successKey="Parties.ExternalMappings.AddSuccess"
      title={t('Parties.ExternalMappings.AddTitle')}
      description={t('Parties.ExternalMappings.AddDescription')}
      data-slot="add-external-mapping-dialog"
    >
      <TextField
        control={form.control}
        name="providerName"
        label={t('Parties.Fields.Provider')}
        placeholder="stripe"
        transform={(value) => value.toLowerCase()}
      />

      <TextField
        control={form.control}
        name="externalId"
        label={t('Parties.Fields.ExternalId')}
        placeholder="cus_…"
      />
    </PartyAddDialog>
  );
}
