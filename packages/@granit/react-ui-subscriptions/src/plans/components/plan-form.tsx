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
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { subscriptionsConstraints } from '@granit/subscriptions';
import { useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

import type { BillingInterval, PlanCreateRequest, PricingModel } from '@granit/subscriptions';

const BILLING_INTERVALS: BillingInterval[] = ['Monthly', 'Quarterly', 'Yearly'];
const PRICING_MODELS: PricingModel[] = ['Flat', 'PerSeat', 'PerUnit', 'Tiered'];

interface PlanFormValues {
  name: string;
  description: string;
  defaultInterval: BillingInterval;
  pricingModel: PricingModel;
}

interface PlanFormProps {
  readonly mode: 'create' | 'edit';
  readonly defaultValues?: Partial<PlanCreateRequest>;
  readonly onSubmit: (data: PlanCreateRequest) => void;
  readonly onCancel: () => void;
  readonly isPending?: boolean;
}

function pickPlanSubmitLabel(
  isPending: boolean | undefined,
  mode: 'create' | 'edit',
  t: ReturnType<typeof useTranslation>['t']
): string {
  if (isPending) return t('Common.Loading');
  return mode === 'create'
    ? t('Subscriptions.Plans.Form.Create')
    : t('Subscriptions.Plans.Form.Update');
}

export function PlanForm({ mode, defaultValues, onSubmit, onCancel, isPending }: PlanFormProps) {
  const { t } = useTranslation();

  // Validation is spec-driven: constraints are generated from
  // contracts/openapi/subscriptions.json. The resolver only validates
  // registered fields; the interval/model selects pass through with defaults.
  // `Validation:Builtin:*` messages are owned by the host `Granit.Validation`.
  const formResolver = useMemo(
    () =>
      createConstraintsResolver(subscriptionsConstraints.PlanCreateRequest, t, {
        labelResolver: (field) => t(`Subscriptions.Plans.Form.${field}`, field),
      }) as unknown as Resolver<PlanFormValues>,
    [t]
  );

  const form = useForm<PlanFormValues>({
    resolver: formResolver,
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      defaultInterval: defaultValues?.defaultInterval ?? 'Monthly',
      pricingModel: defaultValues?.pricingModel ?? 'Flat',
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit({
      name: values.name,
      description: values.description || null,
      defaultInterval: values.defaultInterval,
      pricingModel: values.pricingModel,
      trialDays: null,
      seatLimit: null,
    });
  });

  return (
    <Form {...form}>
      <form data-slot="plan-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Subscriptions.Plans.Form.Name')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Subscriptions.Plans.Form.Description')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="defaultInterval"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Subscriptions.Plans.Form.BillingInterval')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BILLING_INTERVALS.map((interval) => (
                      <SelectItem key={interval} value={interval}>
                        {t(`Subscriptions.BillingInterval.${interval}`)}
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
            name="pricingModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Subscriptions.Plans.Form.PricingModel')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRICING_MODELS.map((model) => (
                      <SelectItem key={model} value={model}>
                        {t(`Subscriptions.PricingModel.${model}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            {t('Common.Cancel')}
          </Button>
          <Button type="submit" disabled={isPending}>
            {pickPlanSubmitLabel(isPending, mode, t)}
          </Button>
        </div>
      </form>
    </Form>
  );
}
