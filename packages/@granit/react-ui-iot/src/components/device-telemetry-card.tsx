import { useLatestTelemetry, useTelemetryAggregate } from '@granit/react-iot';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@granit/react-ui';
import { Calculator } from 'lucide-react';
import { useState } from 'react';

import type { TelemetryAggregation } from '@granit/iot';
import type { TelemetryAggregateArgs } from '@granit/react-iot';

const AGGREGATIONS: readonly TelemetryAggregation[] = ['Avg', 'Min', 'Max', 'Count'];

interface DeviceTelemetryCardProps {
  readonly deviceId: string;
}

/**
 * Device telemetry panel: the latest recorded point plus an on-demand metric
 * aggregate (avg / min / max / count over the default server window).
 */
export function DeviceTelemetryCard({ deviceId }: Readonly<DeviceTelemetryCardProps>) {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();

  const { data: latest, isLoading: latestLoading } = useLatestTelemetry(deviceId);

  const [metric, setMetric] = useState('');
  const [aggregation, setAggregation] = useState<TelemetryAggregation>('Avg');
  const [args, setArgs] = useState<TelemetryAggregateArgs | null>(null);
  const { data: aggregate, isFetching: aggregating } = useTelemetryAggregate(args);

  const handleCompute = () => {
    if (metric.length === 0) return;
    setArgs({ deviceId, metric, aggregation });
  };

  return (
    <Card data-slot="device-telemetry-card">
      <CardHeader>
        <CardTitle className="text-base">{t('IoT.Telemetry.LatestTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {latestLoading && <Skeleton className="h-16" />}
        {!latestLoading && !latest && (
          <p className="text-sm text-muted-foreground">{t('IoT.Telemetry.NoData')}</p>
        )}
        {!latestLoading && latest && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {t('IoT.Telemetry.RecordedAt')} {formatDateTime(latest.recordedAt)}
              {latest.source ? ` · ${t('IoT.Telemetry.Source')}: ${latest.source}` : ''}
            </p>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(latest.metrics).map(([key, value]) => (
                <div key={key} className="rounded-md border border-border/60 p-3">
                  <dt className="text-xs font-medium text-muted-foreground">{key}</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* On-demand metric aggregate */}
        <div className="space-y-3 border-t border-border/60 pt-4">
          <p className="text-sm font-medium text-foreground">
            {t('IoT.Telemetry.Aggregate.Title')}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-40">
              <label className="text-xs text-muted-foreground" htmlFor="tlm-metric">
                {t('IoT.Telemetry.Aggregate.Metric')}
              </label>
              <Input
                id="tlm-metric"
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                placeholder={t('IoT.Telemetry.Aggregate.MetricPlaceholder')}
              />
            </div>
            <div className="min-w-36">
              <label className="text-xs text-muted-foreground" htmlFor="tlm-aggregation">
                {t('IoT.Telemetry.Aggregate.Aggregation')}
              </label>
              <Select
                value={aggregation}
                onValueChange={(value) => setAggregation(value as TelemetryAggregation)}
              >
                <SelectTrigger id="tlm-aggregation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGGREGATIONS.map((agg) => (
                    <SelectItem key={agg} value={agg}>
                      {t(`IoT.Telemetry.Aggregation.${agg}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={handleCompute}
              disabled={metric.length === 0 || aggregating}
            >
              <Calculator className="mr-2 h-4 w-4" />
              {t('IoT.Telemetry.Aggregate.Compute')}
            </Button>
          </div>

          {aggregate && (
            <div className="flex gap-6 rounded-md bg-muted/40 p-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('IoT.Telemetry.Aggregate.Value')}
                </p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {aggregate.value}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('IoT.Telemetry.Aggregate.Count')}
                </p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {aggregate.count}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
