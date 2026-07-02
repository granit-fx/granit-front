import { isMarkdownSnapshotEnvelope } from '@granit/dashboards';
import { useTranslation } from '@granit/react-localization';

import { DashboardMarkdown } from './dashboard-markdown';

import type { DashboardRenderedWidget } from '@granit/dashboards';

/**
 * Snapshot-side `Markdown` renderer that actually parses Markdown — the rich
 * counterpart to the verbatim fallback in `@granit/react-dashboards`. This is
 * the runtime path for backend-rendered dashboards (`POST
 * /dashboards/{id}/render`), so composing {@link markdownSnapshotWidgetRegistry}
 * after `defaultSnapshotWidgetRegistry` is what makes every dashboard banner
 * render its headings instead of raw `##`.
 */
export function RichMarkdownSnapshotWidget({
  widget,
}: {
  readonly widget: DashboardRenderedWidget;
}) {
  const { t } = useTranslation();
  if (!isMarkdownSnapshotEnvelope(widget) || !widget.snapshot) return null;
  const content = t(widget.snapshot.contentLocalizationKey, {
    defaultValue: widget.snapshot.contentLocalizationKey,
  });
  return <DashboardMarkdown content={content} />;
}
