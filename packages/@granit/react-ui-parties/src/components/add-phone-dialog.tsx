import { useTranslation } from '@granit/react-localization';
import { useAddPartyPhoneMutation } from '@granit/react-parties';
import {
  CheckboxField,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  SelectField,
  TextField,
} from '@granit/react-ui';
import { PhoneInput } from '@granit/react-ui-admin-kit';
import { useForm } from 'react-hook-form';

import { PHONE_KINDS } from '../constants';
import { createPartyPhoneResolver, type PartyPhoneFormValues } from '../validation';

import { PartyAddDialog } from './party-add-dialog';

import type { PartyId, PhoneKind } from '@granit/parties';

interface AddPhoneDialogProps {
  readonly partyId: PartyId;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function AddPhoneDialog({ partyId, open, onOpenChange }: AddPhoneDialogProps) {
  const { t } = useTranslation();
  const mutation = useAddPartyPhoneMutation();

  const form = useForm<PartyPhoneFormValues>({
    resolver: createPartyPhoneResolver(t),
    defaultValues: { kind: 'Work', number: '', label: null, isPrimary: false },
  });

  const submit = (values: PartyPhoneFormValues) =>
    mutation.mutateAsync({
      id: partyId,
      request: {
        kind: values.kind as PhoneKind,
        number: values.number,
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
      successKey="Parties.Phones.AddSuccess"
      title={t('Parties.Phones.AddTitle')}
      description={t('Parties.Phones.AddDescription')}
      data-slot="add-phone-dialog"
    >
      <SelectField
        control={form.control}
        name="kind"
        label={t('Parties.Fields.PhoneKind')}
        options={PHONE_KINDS.map((k) => ({ value: k, label: t(`Parties.PhoneKind.${k}`) }))}
      />

      <FormField
        control={form.control}
        name="number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('Parties.Fields.PhoneNumber')}</FormLabel>
            <FormControl>
              <PhoneInput
                value={field.value ?? null}
                onChange={(next) => field.onChange(next ?? '')}
                name={field.name}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
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
