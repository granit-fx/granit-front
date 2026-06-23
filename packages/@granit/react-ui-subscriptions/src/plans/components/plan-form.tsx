import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@granit/react-ui';
import { useState, type FormEvent } from 'react';

import type { BillingInterval, PlanCreateRequest, PricingModel } from '@granit/subscriptions';

const BILLING_INTERVALS: BillingInterval[] = ['Monthly', 'Quarterly', 'Yearly'];
const PRICING_MODELS: PricingModel[] = ['Flat', 'PerSeat', 'PerUnit', 'Tiered'];

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
  const [name, setName] = useState(defaultValues?.name ?? '');
  const [description, setDescription] = useState(defaultValues?.description ?? '');
  const [defaultInterval, setDefaultInterval] = useState<BillingInterval>(
    defaultValues?.defaultInterval ?? 'Monthly'
  );
  const [pricingModel, setPricingModel] = useState<PricingModel>(
    defaultValues?.pricingModel ?? 'Flat'
  );

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit({
      name,
      description: description || null,
      defaultInterval,
      pricingModel,
      trialDays: null,
      seatLimit: null,
    });
  }

  return (
    <form data-slot="plan-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="plan-name">{t('Subscriptions.Plans.Form.Name')}</Label>
        <Input
          id="plan-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          aria-describedby="plan-name-hint"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan-description">{t('Subscriptions.Plans.Form.Description')}</Label>
        <Input
          id="plan-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="plan-billing-interval">
            {t('Subscriptions.Plans.Form.BillingInterval')}
          </Label>
          <Select
            value={defaultInterval}
            onValueChange={(v) => setDefaultInterval(v as BillingInterval)}
          >
            <SelectTrigger id="plan-billing-interval">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BILLING_INTERVALS.map((interval) => (
                <SelectItem key={interval} value={interval}>
                  {t(`Subscriptions.BillingInterval.${interval}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan-pricing-model">{t('Subscriptions.Plans.Form.PricingModel')}</Label>
          <Select value={pricingModel} onValueChange={(v) => setPricingModel(v as PricingModel)}>
            <SelectTrigger id="plan-pricing-model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRICING_MODELS.map((model) => (
                <SelectItem key={model} value={model}>
                  {t(`Subscriptions.PricingModel.${model}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
  );
}
