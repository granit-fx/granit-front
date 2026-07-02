import { Datasource, isMetricDatasource, isQueryAggregateDatasource } from '@granit/dashboards';
import { useMetricCatalog, useQueryFieldMetadata } from '@granit/react-analytics';
import { useTranslation } from 'react-i18next';

import {
  EnumSelect,
  MetricNameCombobox,
  QueryNameCombobox,
  RequiredMark,
} from './query-field-controls';

import type { KpiWidgetDefinition } from '@granit/analytics';
import type { AggregateFunction } from '@granit/dashboards';
import type { WidgetConfigFormProps } from '@granit/react-dashboard-editor';

const KIND_OPTIONS = [
  { value: 'metric', label: 'Metric' },
  { value: 'query-aggregate', label: 'Query aggregate' },
] as const;

const AGGREGATIONS: readonly AggregateFunction[] = ['Sum', 'Avg', 'Min', 'Max', 'Count'];

/**
 * Built-in config form for {@link KpiWidgetDefinition}. v1 covers the two
 * common datasource flavours — Metric (the typical case) and
 * QueryAggregate (ad-hoc admin pages reusing the widget).
 *
 * Both datasource fields are catalogue-backed comboboxes that also accept a
 * typed value: the query field from the query-engine catalogue (like the
 * chart/table/pivot forms), the metric field from the metric catalogue
 * (`GET /analytics/metrics/catalog`). Each degrades to free-text when its
 * catalogue can't be resolved.
 *
 * Telemetry datasources are out of scope for the form: those carry an
 * `entityAlias` that only makes sense in an IoT context. Apps wanting to
 * edit telemetry-bound KPIs ship a custom form via
 * `composeWidgetConfigFormRegistries`.
 */
export function KpiConfigForm({ widget, onChange }: WidgetConfigFormProps<KpiWidgetDefinition>) {
  const { t } = useTranslation();
  const { datasource } = widget;

  const queryName = isQueryAggregateDatasource(datasource) ? datasource.queryName : '';
  const { catalogEntries } = useQueryFieldMetadata(queryName);
  const { data: metricEntries } = useMetricCatalog();

  const handleKindChange = (kind: string) => {
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
        <EnumSelect
          slot="kpi-datasource-kind"
          value={datasource.kind === 'iot-telemetry' ? 'metric' : datasource.kind}
          options={KIND_OPTIONS}
          onChange={handleKindChange}
        />
      </label>

      {isMetricDatasource(datasource) && (
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">
            {t('Dashboard:Widget.Kpi.MetricName.Label')}
            <RequiredMark />
          </span>
          <MetricNameCombobox
            slot="kpi-metric-name"
            value={datasource.metricName}
            required
            onChange={(value) => onChange({ ...widget, datasource: Datasource.metric(value) })}
            entries={metricEntries}
          />
        </label>
      )}

      {isQueryAggregateDatasource(datasource) && (
        <>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              {t('Dashboard:Widget.Kpi.QueryName.Label')}
              <RequiredMark />
            </span>
            <QueryNameCombobox
              slot="kpi-query-name"
              value={datasource.queryName}
              required
              onChange={(value) =>
                onChange({
                  ...widget,
                  datasource: Datasource.queryAggregate(
                    value,
                    datasource.aggregation,
                    datasource.field
                  ),
                })
              }
              entries={catalogEntries}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              {t('Dashboard:Widget.Kpi.Aggregation.Label')}
            </span>
            <EnumSelect
              slot="kpi-aggregation"
              value={datasource.aggregation}
              options={AGGREGATIONS}
              onChange={(value) =>
                onChange({
                  ...widget,
                  datasource: Datasource.queryAggregate(
                    datasource.queryName,
                    value as AggregateFunction,
                    datasource.field
                  ),
                })
              }
            />
          </label>
        </>
      )}
    </div>
  );
}
