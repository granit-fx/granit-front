import { useTranslation } from '@granit/react-localization';
import { useActivePlans, useCreateSubscription } from '@granit/react-subscriptions';
import {
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
  toast,
} from '@granit/react-ui';
import { FormDialog } from '@granit/react-ui-kit';
import { createConstraintsResolver } from '@granit/react-validation';
import { subscriptionsConstraints } from '@granit/subscriptions';
import { toEntityId, toISODateString } from '@granit/types';
import { useForm, type Resolver } from 'react-hook-form';

import type { PlanId } from '@granit/subscriptions';
import type { CurrencyCode } from '@granit/types';

interface CreateSubscriptionFormValues {
  partyId: string;
  planId: string;
  currency: string;
  // `datetime-local` string; converted to an ISO date (or null) on submit.
  trialEndsAt: string;
}

interface CreateSubscriptionDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function CreateSubscriptionDialog({ open, onOpenChange }: CreateSubscriptionDialogProps) {
  const { t } = useTranslation();
  const createSubscription = useCreateSubscription();
  const { data: plans } = useActivePlans();

  const form = useForm<CreateSubscriptionFormValues>({
    resolver: createConstraintsResolver(subscriptionsConstraints.SubscriptionCreateRequest, t, {
      labelResolver: (field) => t(`Subscriptions.List.Form.${field}`, field),
    }) as unknown as Resolver<CreateSubscriptionFormValues>,
    defaultValues: { partyId: '', planId: '', currency: 'EUR', trialEndsAt: '' },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  function onSubmit(values: CreateSubscriptionFormValues) {
    createSubscription.mutate(
      {
        partyId: values.partyId,
        planId: toEntityId<'Plan'>(values.planId) as PlanId,
        currency: values.currency as CurrencyCode,
        trialEndsAt: values.trialEndsAt ? toISODateString(values.trialEndsAt) : null,
      },
      {
        onSuccess: () => {
          toast.success(t('Subscriptions.List.CreateSuccess'));
          handleOpenChange(false);
        },
      }
    );
  }

  const publishedPlans = plans?.filter((p) => p.lifecycleStatus === 'Published') ?? [];

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      form={form}
      onSubmit={onSubmit}
      title={t('Subscriptions.List.Create')}
      description={t('Subscriptions.List.CreateDescription')}
      submitLabel={t('Subscriptions.List.Create')}
      busyLabel={t('Common.Loading')}
      isSubmitting={createSubscription.isPending}
      data-slot="create-subscription-dialog"
    >
      <FormField
        control={form.control}
        name="partyId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('Subscriptions.List.Form.Party')}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="planId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('Subscriptions.List.Form.Plan')}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('Subscriptions.List.Form.SelectPlan')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {publishedPlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
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
        name="currency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('Subscriptions.List.Form.Currency')}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="trialEndsAt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('Subscriptions.List.Form.TrialEndsAt')}</FormLabel>
            <FormControl>
              <Input {...field} type="datetime-local" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
