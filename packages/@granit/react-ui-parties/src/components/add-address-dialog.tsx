import { useTranslation } from '@granit/react-localization';
import { useAddPartyAddressMutation } from '@granit/react-parties';
import { CheckboxField, SelectField, TextField } from '@granit/react-ui';
import { useForm } from 'react-hook-form';

import { ADDRESS_KINDS } from '../constants';
import { createPartyAddressResolver, type PartyAddressFormValues } from '../validation';

import { PartyAddDialog } from './party-add-dialog';

import type { AddressKind, PartyId } from '@granit/parties';

interface AddAddressDialogProps {
  readonly partyId: PartyId;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function AddAddressDialog({ partyId, open, onOpenChange }: AddAddressDialogProps) {
  const { t } = useTranslation();
  const mutation = useAddPartyAddressMutation();

  const form = useForm<PartyAddressFormValues>({
    resolver: createPartyAddressResolver(t),
    defaultValues: {
      kind: 'Billing',
      street1: '',
      street2: null,
      city: '',
      state: null,
      postalCode: '',
      country: 'BE',
      label: null,
      isDefault: false,
    },
  });

  const submit = (values: PartyAddressFormValues) =>
    mutation.mutateAsync({
      id: partyId,
      request: {
        kind: values.kind as AddressKind,
        street1: values.street1,
        street2: values.street2 ?? null,
        city: values.city,
        state: values.state ?? null,
        postalCode: values.postalCode,
        country: values.country,
        label: values.label ?? null,
        isDefault: values.isDefault ?? false,
      },
    });

  return (
    <PartyAddDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      submit={submit}
      isPending={mutation.isPending}
      successKey="Parties.Addresses.AddSuccess"
      title={t('Parties.Addresses.AddTitle')}
      description={t('Parties.Addresses.AddDescription')}
      data-slot="add-address-dialog"
    >
      <SelectField
        control={form.control}
        name="kind"
        label={t('Parties.Fields.AddressKind')}
        options={ADDRESS_KINDS.map((k) => ({ value: k, label: t(`Parties.AddressKind.${k}`) }))}
      />

      <TextField control={form.control} name="street1" label={t('Parties.Fields.Street1')} />
      <TextField control={form.control} name="street2" label={t('Parties.Fields.Street2')} />

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          control={form.control}
          name="postalCode"
          label={t('Parties.Fields.PostalCode')}
        />
        <TextField control={form.control} name="city" label={t('Parties.Fields.City')} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField control={form.control} name="state" label={t('Parties.Fields.State')} />
        <TextField
          control={form.control}
          name="country"
          label={t('Parties.Fields.Country')}
          maxLength={2}
          placeholder="BE"
          transform={(value) => value.toUpperCase()}
        />
      </div>

      <TextField control={form.control} name="label" label={t('Parties.Fields.Label')} />

      <CheckboxField
        control={form.control}
        name="isDefault"
        label={t('Parties.Fields.IsDefault')}
      />
    </PartyAddDialog>
  );
}
