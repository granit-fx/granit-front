import { meteringConstraints } from '@granit/metering';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { createConstraintsResolver } from '@granit/react-validation';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import type { MeterDefinitionResponse } from '@granit/metering';
import type { Resolver } from 'react-hook-form';

// CountDistinct is intentionally omitted — it requires a `distinctProperty`,
// which this form does not collect.
const AGGREGATION_TYPES = ['Sum', 'Count', 'Max', 'Last'] as const;

function capitalize(value: string): string {
  return value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);
}

export interface MeterFormValues {
  name: string;
  description: string;
  aggregationType: string;
  unit: string;
}

interface MeterFormBaseProps {
  onCancel: () => void;
  onSubmit: (data: MeterFormValues) => Promise<void>;
  isPending?: boolean;
}

interface CreateMeterFormProps extends MeterFormBaseProps {
  mode: 'create';
  defaultValues?: never;
}

interface EditMeterFormProps extends MeterFormBaseProps {
  mode: 'edit';
  defaultValues: MeterDefinitionResponse;
}

type MeterFormProps = CreateMeterFormProps | EditMeterFormProps;

export function MeterForm(props: Readonly<MeterFormProps>) {
  const { mode, onCancel, onSubmit, isPending = false } = props;
  const { t } = useTranslation();
  const isEdit = mode === 'edit';

  // Validation is spec-driven: constraints are generated from
  // contracts/openapi/metering.json. The resolver only validates registered
  // fields, so the `aggregationType` select passes through with its default. On
  // edit the MeterDefinitionUpdateRequest spec applies (no aggregationType).
  // `Validation:Builtin:*` messages are owned by the host `Granit.Validation`.
  const formResolver = useMemo(
    () =>
      createConstraintsResolver(
        isEdit
          ? meteringConstraints.MeterDefinitionUpdateRequest
          : meteringConstraints.MeterDefinitionCreateRequest,
        t,
        { labelResolver: (field) => t(`Metering.Fields.${capitalize(field)}`, field) }
      ) as unknown as Resolver<MeterFormValues>,
    [isEdit, t]
  );

  const form = useForm<MeterFormValues>({
    resolver: formResolver,
    defaultValues: {
      name: props.defaultValues?.name ?? '',
      description: props.defaultValues?.description ?? '',
      aggregationType: props.defaultValues?.aggregationType ?? 'Count',
      unit: props.defaultValues?.unit ?? '',
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Form {...form}>
      <form data-slot="meter-form" onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {mode === 'create' ? t('Metering.Form.CreateTitle') : t('Metering.Form.EditTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Metering.Form.Name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('Metering.Form.NamePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="aggregationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Metering.Form.AggregationType')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AGGREGATION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Metering.Form.Unit')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('Metering.Form.UnitPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="sm:col-span-2">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Metering.Form.Description')}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={t('Metering.Form.DescriptionPlaceholder')}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? '...' : t('Common.Save')}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('Common.Cancel')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
