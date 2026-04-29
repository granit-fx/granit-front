import { Datasource, isMetricDatasource, isQueryAggregateDatasource } from '@granit/dashboards';
import { useTranslation } from 'react-i18next';

import type { KpiWidgetDefinition } from '@granit/analytics';
import type { AggregateFunction } from '@granit/dashboards';
import type { WidgetConfigFormProps } from '@granit/react-dashboard-editor';

/**
 * Built-in config form for {@link KpiWidgetDefinition}. v1 covers the two
 * common datasource flavours — Metric (the typical case) and
 * QueryAggregate (ad-hoc admin pages reusing the widget).
 *
 * Telemetry datasources are out of scope for the form: those carry an
 * `entityAlias` that only makes sense in an IoT context. Apps wanting to
 * edit telemetry-bound KPIs ship a custom form via
 * `composeWidgetConfigFormRegistries`.
 */
export function KpiConfigForm({ widget, onChange }: WidgetConfigFormProps<KpiWidgetDefinition>) {
  const { t } = useTranslation();
  const { datasource } = widget;

  const handleKindChange = (kind: 'metric' | 'query-aggregate') => {
    if (kind === 'metric') {
      onChange({ ...widget, datasource: Datasource.metric('') });
    } else {
      onChange({ ...widget, datasource: Datasource.queryAggregate('', 'Sum') });
    }
  };

  return (
    <div data-slot="kpi-config-form" className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">
          {t('Dashboard:Widget.Kpi.DatasourceKind.Label')}
        </span>
        <select
          data-slot="kpi-datasource-kind"
          value={datasource.kind === 'iot-telemetry' ? 'metric' : datasource.kind}
          onChange={(event) => handleKindChange(event.target.value as 'metric' | 'query-aggregate')}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value="metric">Metric</option>
          <option value="query-aggregate">Query aggregate</option>
        </select>
      </label>

      {isMetricDatasource(datasource) && (
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">
            {t('Dashboard:Widget.Kpi.MetricName.Label')}
          </span>
          <input
            type="text"
            data-slot="kpi-metric-name"
            value={datasource.metricName}
            onChange={(event) =>
              onChange({ ...widget, datasource: Datasource.metric(event.target.value) })
            }
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </label>
      )}

      {isQueryAggregateDatasource(datasource) && (
        <>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              {t('Dashboard:Widget.Kpi.QueryName.Label')}
            </span>
            <input
              type="text"
              data-slot="kpi-query-name"
              value={datasource.queryName}
              onChange={(event) =>
                onChange({
                  ...widget,
                  datasource: Datasource.queryAggregate(
                    event.target.value,
                    datasource.aggregation,
                    datasource.field
                  ),
                })
              }
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              {t('Dashboard:Widget.Kpi.Aggregation.Label')}
            </span>
            <select
              data-slot="kpi-aggregation"
              value={datasource.aggregation}
              onChange={(event) =>
                onChange({
                  ...widget,
                  datasource: Datasource.queryAggregate(
                    datasource.queryName,
                    event.target.value as AggregateFunction,
                    datasource.field
                  ),
                })
              }
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              <option value="Sum">Sum</option>
              <option value="Avg">Avg</option>
              <option value="Min">Min</option>
              <option value="Max">Max</option>
              <option value="Count">Count</option>
            </select>
          </label>
        </>
      )}
    </div>
  );
}
