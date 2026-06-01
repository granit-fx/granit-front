import { ChartSnapshotWidget } from './chart-snapshot-widget';

import type { SnapshotWidgetRegistry } from '@granit/react-dashboards';

/**
 * Snapshot renderer registry contributed by `@granit/react-charts`. Compose
 * with the framework default + analytics registries at the app root:
 *
 *     <SnapshotWidgetRegistryProvider registries={[
 *       defaultSnapshotWidgetRegistry,             // Markdown / Text / Image
 *       defaultAnalyticsSnapshotWidgetRegistry,    // Kpi
 *       defaultChartSnapshotWidgetRegistry,        // Chart
 *       // app-specific overrides
 *     ]}>
 *
 * Apps that don't ship `Chart` widgets don't import this and pay zero
 * ECharts bundle weight.
 */
export const defaultChartSnapshotWidgetRegistry: SnapshotWidgetRegistry = Object.freeze({
  Chart: ChartSnapshotWidget,
});
