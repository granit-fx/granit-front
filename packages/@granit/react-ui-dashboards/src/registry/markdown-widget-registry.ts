import { RichMarkdownSnapshotWidget } from '../components/widgets/markdown-snapshot-widget';
import { RichMarkdownWidget } from '../components/widgets/markdown-widget';

import type {
  SnapshotWidgetRegistry,
  WidgetRegistry,
  WidgetRendererFn,
} from '@granit/react-dashboards';

/**
 * Definition-side override that swaps the verbatim `markdown` fallback for the
 * react-markdown-backed {@link RichMarkdownWidget}. Compose it **after**
 * `defaultWidgetRegistry` so it wins the `markdown` key:
 *
 * @example
 *   const registries = [
 *     defaultWidgetRegistry,
 *     defaultAnalyticsWidgetRegistry,
 *     markdownWidgetRegistry, // real Markdown for the editor preview + fixtures
 *   ];
 */
export const markdownWidgetRegistry: WidgetRegistry = Object.freeze({
  // The registry renderer is typed over the full `WidgetDefinition` union;
  // this one narrows to `markdown`, so cast like `defaultWidgetRegistry` does.
  markdown: RichMarkdownWidget as WidgetRendererFn,
});

/**
 * Snapshot-side override — the runtime path for backend-rendered dashboards.
 * Compose it **after** `defaultSnapshotWidgetRegistry` so it wins the
 * `Markdown` key:
 *
 * @example
 *   const snapshotRegistries = [
 *     defaultSnapshotWidgetRegistry,
 *     defaultAnalyticsSnapshotWidgetRegistry,
 *     markdownSnapshotWidgetRegistry, // real Markdown for every banner
 *   ];
 */
export const markdownSnapshotWidgetRegistry: SnapshotWidgetRegistry = Object.freeze({
  Markdown: RichMarkdownSnapshotWidget,
});
