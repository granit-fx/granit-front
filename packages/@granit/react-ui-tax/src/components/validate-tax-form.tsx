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
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { taxConstraints } from '@granit/tax';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import type { Resolver } from 'react-hook-form';

export interface TaxValidateFormValues {
  taxId: string;
  countryCode: string;
}

interface ValidateTaxFormProps {
  readonly onSubmit: (data: TaxValidateFormValues) => void;
  readonly isPending?: boolean;
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);
}

export function ValidateTaxForm({ onSubmit, isPending = false }: ValidateTaxFormProps) {
  const { t } = useTranslation();

  // Validation is spec-driven: constraints are generated from
  // contracts/openapi/tax.json (`taxId`/`countryCode` required + maxLength,
  // `countryCode` minLength). The resolver only validates registered fields, so
  // unconstrained fields pass through. `Validation:Builtin:*` messages are owned
  // by the host `Granit.Validation` bundle.
  const formResolver = useMemo(
    () =>
      createConstraintsResolver(taxConstraints.TaxValidateRequest, t, {
        labelResolver: (field) => t(`Tax.Fields.${capitalize(field)}`, field),
      }) as unknown as Resolver<TaxValidateFormValues>,
    [t]
  );

  const form = useForm<TaxValidateFormValues>({
    resolver: formResolver,
    defaultValues: {
      taxId: '',
      countryCode: '',
    },
  });

  return (
    <Form {...form}>
      <form
        data-slot="validate-tax-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="taxId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Tax.Validate.TaxId')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('Tax.Validate.TaxIdPlaceholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="countryCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Tax.Validate.CountryCode')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('Tax.Validate.CountryCodePlaceholder')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t('Tax.Validate.Submit')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
