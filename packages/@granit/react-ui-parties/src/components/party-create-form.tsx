import { useTranslation } from '@granit/react-localization';
import {
  Button,
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
  Textarea,
} from '@granit/react-ui';
import { TimezonePicker, UrlInput } from '@granit/react-ui-kit';
import { useForm } from 'react-hook-form';

import { PARTY_ASSIGNABLE_ROLES, PARTY_KINDS } from '../constants';
import { createPartyCreateResolver, type PartyCreateFormValues } from '../validation';

interface PartyCreateFormProps {
  readonly onSubmit: (values: PartyCreateFormValues) => void | Promise<void>;
  readonly onCancel: () => void;
  readonly isPending: boolean;
}

export function PartyCreateForm({ onSubmit, onCancel, isPending }: PartyCreateFormProps) {
  const { t } = useTranslation();
  const form = useForm<PartyCreateFormValues>({
    resolver: createPartyCreateResolver(t),
    defaultValues: {
      kind: 'Company',
      name: '',
      defaultCurrency: 'EUR',
      role: 'Customer',
      website: null,
      language: null,
      timezone: null,
      internalNotes: null,
    },
  });

  return (
    <Form {...form}>
      <form
        data-slot="party-create-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="kind"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Parties.Fields.Kind')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Parties.Fields.Kind')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PARTY_KINDS.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {t(`Parties.Kind.${kind}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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
          name="defaultCurrency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Parties.Fields.DefaultCurrency')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  maxLength={3}
                  placeholder="EUR"
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Parties.Fields.InitialRole')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Parties.Fields.InitialRole')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="None">{t('Parties.Role.None')}</SelectItem>
                  {PARTY_ASSIGNABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {t(`Parties.Role.${role}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  rows={4}
                  maxLength={8000}
                  placeholder={t('Parties.Fields.InternalNotesHint')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            {t('Common.Cancel')}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? t('Common.Loading') : t('Parties.Create.Submit')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
