import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@granit/react-ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { createTenantSchema, editTenantSchema } from '../validation';

import type { CreateTenantFormValues, EditTenantFormValues } from '../validation';

interface CreateFormProps {
  readonly mode: 'create';
  readonly onSubmit: (values: CreateTenantFormValues) => void;
  readonly onCancel: () => void;
  readonly isSubmitting: boolean;
}

interface EditFormProps {
  readonly mode: 'edit';
  readonly defaultValues: EditTenantFormValues;
  readonly readOnlyIdentifier: string;
  readonly onSubmit: (values: EditTenantFormValues) => void;
  readonly onCancel: () => void;
  readonly isSubmitting: boolean;
}

type TenantFormProps = CreateFormProps | EditFormProps;

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '');
}

export function TenantForm(props: TenantFormProps) {
  const { t } = useTranslation();
  const { mode, onCancel, isSubmitting } = props;
  const identifierTouched = useRef(false);

  const form = useForm<CreateTenantFormValues | EditTenantFormValues>({
    resolver: zodResolver(mode === 'create' ? createTenantSchema : editTenantSchema),
    defaultValues:
      mode === 'edit'
        ? props.defaultValues
        : { name: '', identifier: '', contactEmail: '', jurisdiction: '' },
  });

  const nameValue = form.watch('name');

  useEffect(() => {
    if (mode !== 'create' || identifierTouched.current) return;
    const slug = toSlug(nameValue);
    form.setValue('identifier', slug, { shouldValidate: slug.length > 0 });
  }, [nameValue, mode, form]);

  function handleSubmit(values: CreateTenantFormValues | EditTenantFormValues) {
    if (mode === 'create') {
      props.onSubmit(values as CreateTenantFormValues);
    } else {
      props.onSubmit(values as EditTenantFormValues);
    }
  }

  return (
    <Form {...form}>
      <form
        data-slot="tenant-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('Tenants.Form.Details')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Tenants.Form.Name')}</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={256} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'create' ? (
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Tenants.Form.Identifier')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="acme-corp"
                        maxLength={64}
                        className="font-mono"
                        onChange={(e) => {
                          identifierTouched.current = true;
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <FormDescription>{t('Tenants.Form.IdentifierHint')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="space-y-2">
                <FormLabel>{t('Tenants.Form.Identifier')}</FormLabel>
                <Input value={props.readOnlyIdentifier} disabled className="font-mono" />
                <p className="text-[0.8rem] text-muted-foreground">
                  {t('Tenants.Form.IdentifierReadOnly')}
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Tenants.Form.ContactEmail')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" value={field.value ?? ''} maxLength={256} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jurisdiction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Tenants.Form.Jurisdiction')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="FR"
                      maxLength={16}
                      className="font-mono uppercase"
                    />
                  </FormControl>
                  <FormDescription>{t('Tenants.Form.JurisdictionHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('Common.Loading') : t('Common.Save')}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('Common.Cancel')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
