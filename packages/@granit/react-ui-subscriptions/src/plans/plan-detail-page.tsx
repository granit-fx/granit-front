import { useTranslation } from '@granit/react-localization';
import { usePlan } from '@granit/react-subscriptions';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
} from '@granit/react-ui';
import { EmptyState } from '@granit/react-ui-admin-kit';
import { toEntityId } from '@granit/types';
import { formatCurrency } from '@granit/utils';
import { AlertCircle, Archive, ArrowLeft, Pencil, PlusCircle, Rocket } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';


import { ArchivePlanDialog } from './components/archive-plan-dialog';
import { CreatePriceDialog } from './components/create-price-dialog';
import { EditPlanDialog } from './components/edit-plan-dialog';
import { PlanStatusBadge } from './components/plan-status-badge';
import { PriceHistoryTable } from './components/price-history-table';
import { PublishPlanDialog } from './components/publish-plan-dialog';

export function PlanDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const planId = toEntityId<'Plan'>(id ?? '');
  const { data: plan, isLoading, error } = usePlan(planId);

  const [editOpen, setEditOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);

  if (isLoading) {
    return (
      <div data-slot="plan-detail-page" className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div data-slot="plan-detail-page" className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/subscriptions/plans">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('Subscriptions.Plans.BackToList')}
            </Link>
          </Button>
        </div>
        <EmptyState icon={AlertCircle} message={t('Subscriptions.Plans.NotFound')} />
      </div>
    );
  }

  return (
    <div data-slot="plan-detail-page" className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/subscriptions/plans">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('Subscriptions.Plans.BackToList')}
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-foreground">{plan.name}</h2>
          {plan.description && (
            <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
          )}
        </div>
        <PlanStatusBadge status={plan.lifecycleStatus} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {plan.lifecycleStatus === 'Draft' && (
          <Button size="sm" onClick={() => setPublishOpen(true)}>
            <Rocket className="mr-2 h-4 w-4" />
            {t('Subscriptions.Plans.Publish')}
          </Button>
        )}
        {plan.lifecycleStatus === 'Published' && (
          <Button size="sm" variant="destructive" onClick={() => setArchiveOpen(true)}>
            <Archive className="mr-2 h-4 w-4" />
            {t('Subscriptions.Plans.Archive')}
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => setPriceOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('Subscriptions.Plans.CreatePriceVersion')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          {t('Subscriptions.Plans.Edit')}
        </Button>
      </div>

      {/* Plan details */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Subscriptions.Plans.Details')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('Subscriptions.Plans.Columns.DefaultInterval')}
              </dt>
              <dd className="mt-1 font-medium text-foreground">
                {t(`Subscriptions.BillingInterval.${plan.defaultInterval}`)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('Subscriptions.Plans.Columns.PricingModel')}
              </dt>
              <dd className="mt-1 font-medium text-foreground">
                {t(`Subscriptions.PricingModel.${plan.pricingModel}`)}
              </dd>
            </div>
            {plan.prices.length > 0 &&
              (() => {
                const activePrice = plan.prices.find((p) => p.isCurrent);
                return activePrice ? (
                  <div>
                    <dt className="text-sm text-muted-foreground">
                      {t('Subscriptions.Plans.Columns.CurrentPrice')}
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {formatCurrency(activePrice.amount, activePrice.currency, i18n.language)}
                    </dd>
                  </div>
                ) : null;
              })()}
          </dl>
        </CardContent>
      </Card>

      {/* Price history */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Subscriptions.Plans.PriceHistory')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PriceHistoryTable prices={[...(plan?.prices ?? [])]} isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditPlanDialog
        planId={plan.id}
        defaultName={plan.name}
        defaultDescription={plan.description}
        defaultSortOrder={plan.sortOrder}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <PublishPlanDialog
        planId={plan.id}
        planName={plan.name}
        open={publishOpen}
        onOpenChange={setPublishOpen}
      />
      <ArchivePlanDialog
        planId={plan.id}
        planName={plan.name}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
      />
      <CreatePriceDialog planId={plan.id} open={priceOpen} onOpenChange={setPriceOpen} />
    </div>
  );
}
