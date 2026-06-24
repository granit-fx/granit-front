import { useTranslation } from '@granit/react-localization';
import { useUpdatePartyMutation } from '@granit/react-parties';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  toast,
} from '@granit/react-ui';
import { TimezonePicker, UrlInput } from '@granit/react-ui-kit';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { logger } from '../logger';
import { createPartyIdentityResolver, type PartyIdentityFormValues } from '../validation';

import type { PartyResponse } from '@granit/parties';

interface PartyIdentityFormProps {
  readonly party: PartyResponse;
}

export function PartyIdentityForm({ party }: PartyIdentityFormProps) {
  const { t } = useTranslation();
  const mutation = useUpdatePartyMutation();

  const form = useForm<PartyIdentityFormValues>({
    resolver: createPartyIdentityResolver(t),
    defaultValues: {
      name: party.name,
      website: party.website ?? null,
      language: party.language ?? null,
      timezone: party.timezone ?? null,
      internalNotes: party.internalNotes ?? null,
    },
  });

  useEffect(() => {
    form.reset({
      name: party.name,
      website: party.website ?? null,
      language: party.language ?? null,
      timezone: party.timezone ?? null,
      internalNotes: party.internalNotes ?? null,
    });
  }, [party, form]);

  const handleSubmit = async (values: PartyIdentityFormValues) => {
    try {
      await mutation.mutateAsync({
        id: party.id,
        request: {
          name: values.name,
          website: values.website ?? null,
          language: values.language ?? null,
          timezone: values.timezone ?? null,
          internalNotes: values.internalNotes ?? null,
        },
      });
      toast.success(t('Parties.Edit.Success'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[PartyIdentityForm] update party failed', err);
    }
  };

  return (
    <Form {...form}>
      <form
        data-slot="party-identity-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Parties.Fields.Name')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} maxLength={256} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Parties.Fields.Website')}</FormLabel>
              <FormControl>
                <UrlInput
                  value={field.value ?? null}
                  onChange={(next) => field.onChange(next ?? '')}
                  name={field.name}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Parties.Fields.Language')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} placeholder="fr-BE" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Parties.Fields.Timezone')}</FormLabel>
                <FormControl>
                  <TimezonePicker
                    value={field.value ?? null}
                    onChange={field.onChange}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="internalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Parties.Fields.InternalNotes')}</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ''} rows={4} maxLength={8000} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending || !form.formState.isDirty}>
            {mutation.isPending ? t('Common.Loading') : t('Common.Save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
