// ---------------------------------------------------------------------------
// Required-field validation for the analytics widget config forms.
//
// The config forms mark required fields (asterisk + destructive border on an
// empty control), but marking is only presentational — a host still needs to
// know whether a widget is complete before it persists it, otherwise an empty
// queryName / groupBy / column reaches the backend and the widget renders as
// `status: 'Error'`. `validateWidgetConfig` returns the missing required
// fields so the host can gate its Save button and/or name them in a message.
//
// Covers every analytics + map kind (their definitions all live in
// @granit/analytics); non-analytics kinds carry no required query binding and
// validate as complete.
// ---------------------------------------------------------------------------

import { isGeographyMapPointSource, isLatLngMapPointSource } from '@granit/analytics';
import { isMetricDatasource, isQueryAggregateDatasource } from '@granit/dashboards';

import type {
  ChartWidgetDefinition,
  KpiWidgetDefinition,
  MapWidgetDefinition,
  PivotWidgetDefinition,
  TableWidgetDefinition,
} from '@granit/analytics';
import type { WidgetDefinition } from '@granit/dashboards';

/** A required field a widget is missing, named by its i18n label key. */
export interface WidgetConfigError {
  /** Stable field slug (e.g. `queryName`, `groupBy`) — for tests / focus. */
  readonly field: string;
  /** i18n key of the field's label, so the host can name it in a message. */
  readonly labelKey: string;
}

/** True when a string field is unset, empty, or whitespace-only. */
const blank = (value: string | null | undefined): boolean => (value ?? '').trim().length === 0;

function validateChart(widget: ChartWidgetDefinition): WidgetConfigError[] {
  const errors: WidgetConfigError[] = [];
  if (blank(widget.queryName))
    errors.push({ field: 'queryName', labelKey: 'Dashboard:Widget.Chart.QueryName.Label' });
  if (blank(widget.groupBy))
    errors.push({ field: 'groupBy', labelKey: 'Dashboard:Widget.Chart.GroupBy.Label' });
  // Field is the aggregation target — required for every function except Count.
  if (widget.aggregation !== 'Count' && blank(widget.field))
    errors.push({ field: 'field', labelKey: 'Dashboard:Widget.Chart.Field.Label' });
  return errors;
}

function validateTable(widget: TableWidgetDefinition): WidgetConfigError[] {
  return blank(widget.queryName)
    ? [{ field: 'queryName', labelKey: 'Dashboard:Widget.Table.QueryName.Label' }]
    : [];
}

function validatePivot(widget: PivotWidgetDefinition): WidgetConfigError[] {
  const errors: WidgetConfigError[] = [];
  if (blank(widget.queryName))
    errors.push({ field: 'queryName', labelKey: 'Dashboard:Widget.Pivot.QueryName.Label' });
  if (widget.rowFields.length === 0)
    errors.push({ field: 'rowFields', labelKey: 'Dashboard:Widget.Pivot.RowFields.Label' });
  if (widget.valueAggregation !== 'Count' && blank(widget.valueField))
    errors.push({ field: 'valueField', labelKey: 'Dashboard:Widget.Pivot.ValueField.Label' });
  return errors;
}

function validateKpi(widget: KpiWidgetDefinition): WidgetConfigError[] {
  const { datasource } = widget;
  if (isMetricDatasource(datasource) && blank(datasource.metricName))
    return [{ field: 'metricName', labelKey: 'Dashboard:Widget.Kpi.MetricName.Label' }];
  if (isQueryAggregateDatasource(datasource) && blank(datasource.queryName))
    return [{ field: 'queryName', labelKey: 'Dashboard:Widget.Kpi.QueryName.Label' }];
  return [];
}

function validateMap(widget: MapWidgetDefinition): WidgetConfigError[] {
  const errors: WidgetConfigError[] = [];
  if (blank(widget.queryName))
    errors.push({ field: 'queryName', labelKey: 'Dashboard:Widget.Map.QueryName.Label' });
  const { pointSource } = widget;
  if (isLatLngMapPointSource(pointSource)) {
    if (blank(pointSource.latitudeColumn))
      errors.push({
        field: 'latitudeColumn',
        labelKey: 'Dashboard:Widget.Map.LatitudeColumn.Label',
      });
    if (blank(pointSource.longitudeColumn))
      errors.push({
        field: 'longitudeColumn',
        labelKey: 'Dashboard:Widget.Map.LongitudeColumn.Label',
      });
  } else if (isGeographyMapPointSource(pointSource) && blank(pointSource.geographyColumn)) {
    errors.push({
      field: 'geographyColumn',
      labelKey: 'Dashboard:Widget.Map.GeographyColumn.Label',
    });
  }
  return errors;
}

/**
 * Returns the required fields the widget is missing, or an empty array when it
 * is complete. Switches on the widget `type`; non-analytics kinds (markdown,
 * text, …) carry no required query binding and always validate as complete.
 */
export function validateWidgetConfig(widget: WidgetDefinition): readonly WidgetConfigError[] {
  switch (widget.type) {
    case 'chart':
      return validateChart(widget as ChartWidgetDefinition);
    case 'table':
      return validateTable(widget as TableWidgetDefinition);
    case 'pivot':
      return validatePivot(widget as PivotWidgetDefinition);
    case 'kpi':
      return validateKpi(widget as KpiWidgetDefinition);
    case 'map':
      return validateMap(widget as MapWidgetDefinition);
    default:
      return [];
  }
}

/** Convenience predicate: true when the widget has no missing required field. */
export function isWidgetConfigComplete(widget: WidgetDefinition): boolean {
  return validateWidgetConfig(widget).length === 0;
}
