import { useTranslation } from '@granit/react-localization';
import {
  useMeterDefinition,
  useMeteringQuota,
  usePublishMeterDefinition,
  useUpdateMeterDefinition,
  useUsageForPeriod,
} from '@granit/react-metering';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@granit/react-ui';
import { toEntityId } from '@granit/types';
import { cn } from '@granit/utils';
import { ArrowLeft, Archive, Pencil, Send, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { ArchiveMeterDialog } from './components/archive-meter-dialog';
import { MeterForm } from './components/meter-form';
import { QuotaStatusCard } from './components/quota-status-card';
import { RecordEventsDialog } from './components/record-events-dialog';
import { UsageSummaryCard } from './components/usage-summary-card';

import type { MeterFormValues } from './components/meter-form';

export function MeterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);

  const meterId = toEntityId<'MeterDefinition'>(id ?? '');
  // Current billing month — the usage endpoint matches an aggregate on exact
  // period bounds, so compute a stable [month-start, next-month-start) window.
  const period = useMemo(() => {
    const now = new Date();
    return {
      periodStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(),
      periodEnd: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString(),
    };
  }, []);

  const { data: meter, isLoading: meterLoading } = useMeterDefinition(meterId);
  const { data: usage, isLoading: usageLoading } = useUsageForPeriod({
    meterId,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
  });
  const { data: quota, isLoading: quotaLoading } = useMeteringQuota(meterId);
  const updateMeter = useUpdateMeterDefinition();
  const publishMeter = usePublishMeterDefinition();

  const handlePublish = () => {
    // `mutate` (not `mutateAsync`) routes failures to the global
    // MutationCache.onError toast — no local catch needed.
    publishMeter.mutate(meterId, {
      onSuccess: () => {
        toast.success(t('Metering.PublishSuccess'));
      },
    });
  };

  const handleUpdate = async (data: MeterFormValues) => {
    updateMeter.mutate(
      {
        id: meterId,
        request: { name: data.name, unit: data.unit, description: data.description },
      },
      {
        onSuccess: () => {
          toast.success(t('Metering.UpdateSuccess'));
          setEditOpen(false);
        },
      }
    );
  };

  if (meterLoading) {
    return (
      <div data-slot="meter-detail-page" className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!meter) {
    return (
      <div data-slot="meter-detail-page" className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">{t('Metering.Detail.NotFound')}</p>
      </div>
    );
  }

  return (
    <div data-slot="meter-detail-page" className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/metering')}
            aria-label={t('Common.Back')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-foreground">{meter.name}</h2>
              <Badge
                variant={meter.lifecycleStatus === 'Published' ? 'default' : 'secondary'}
                className={cn(
                  'text-xs',
                  meter.lifecycleStatus === 'Published'
                    ? 'bg-success-500/15 text-success-600 dark:text-success-500 border-success-500/25'
                    : 'bg-muted/50 text-muted-foreground'
                )}
              >
                {t(`Metering.Status.${meter.lifecycleStatus}`)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{meter.description}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setRecordOpen(true)}>
            <Send className="mr-2 h-4 w-4" />
            {t('Metering.Actions.RecordEvents')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            {t('Metering.Actions.Edit')}
          </Button>
          {meter.lifecycleStatus === 'Draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePublish}
              disabled={publishMeter.isPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              {t('Metering.Actions.Publish')}
            </Button>
          )}
          {meter.lifecycleStatus === 'Published' && (
            <Button variant="destructive" size="sm" onClick={() => setArchiveOpen(true)}>
              <Archive className="mr-2 h-4 w-4" />
              {t('Metering.Actions.Archive')}
            </Button>
          )}
        </div>
      </div>

      {/* Meter info card */}
      <Card data-slot="meter-info-card">
        <CardHeader>
          <CardTitle className="text-base">{t('Metering.Detail.InfoTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Metering.Detail.AggregationType')}
              </dt>
              <dd className="mt-1 text-sm text-foreground">{meter.aggregationType}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Metering.Detail.Unit')}
              </dt>
              <dd className="mt-1 text-sm text-foreground">{meter.unit}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Usage & Quota */}
      <div className="grid gap-6 lg:grid-cols-2">
        {usageLoading && <Skeleton className="h-48" />}
        {!usageLoading && usage && <UsageSummaryCard usage={usage} />}

        {quotaLoading && <Skeleton className="h-48" />}
        {!quotaLoading && quota && <QuotaStatusCard quota={quota} />}
      </div>

      {/* Dialogs */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Metering.Form.EditTitle')}</DialogTitle>
            <DialogDescription>{t('Metering.Form.EditDescription')}</DialogDescription>
          </DialogHeader>
          <MeterForm
            mode="edit"
            defaultValues={meter}
            onSubmit={handleUpdate}
            onCancel={() => setEditOpen(false)}
            isPending={updateMeter.isPending}
          />
        </DialogContent>
      </Dialog>

      <ArchiveMeterDialog
        meter={meter}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        onSuccess={() => navigate('/metering')}
      />

      <RecordEventsDialog meter={meter} open={recordOpen} onOpenChange={setRecordOpen} />
    </div>
  );
}
