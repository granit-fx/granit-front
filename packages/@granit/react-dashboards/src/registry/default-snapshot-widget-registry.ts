import { ImageSnapshotWidget } from '../components/widgets/image-snapshot-widget';
import { MarkdownSnapshotWidget } from '../components/widgets/markdown-snapshot-widget';
import { TextSnapshotWidget } from '../components/widgets/text-snapshot-widget';

import type { SnapshotWidgetRegistry } from './snapshot-widget-registry';

/**
 * Snapshot renderers shipped by `@granit/react-dashboards` for the framework's
 * static-content widget kinds (`Markdown` / `Text` / `Image`). Symmetric to
 * {@link defaultWidgetRegistry} on the definition side — both ship the same
 * three kinds, but dispatch is keyed by the wire `widgetType` (PascalCase)
 * here vs the declarative `type` (lowercase) there.
 *
 * Compose with downstream registries (e.g.
 * `defaultAnalyticsSnapshotWidgetRegistry` from `@granit/react-analytics`)
 * via {@link composeSnapshotRegistries}.
 */
export const defaultSnapshotWidgetRegistry: SnapshotWidgetRegistry = Object.freeze({
  Markdown: MarkdownSnapshotWidget,
  Text: TextSnapshotWidget,
  Image: ImageSnapshotWidget,
});
