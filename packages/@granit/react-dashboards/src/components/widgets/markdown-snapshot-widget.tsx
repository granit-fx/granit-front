import { isMarkdownSnapshotEnvelope } from '@granit/dashboards';
import { useTranslation } from 'react-i18next';

import type { DashboardRenderedWidget } from '@granit/dashboards';

/**
 * Built-in snapshot renderer for the `'Markdown'` widget kind. Resolves the
 * snapshot's localization key via `useTranslation()` (same i18n surface as
 * the definition-side {@link MarkdownWidget}) and renders the body inline.
 *
 * The renderer is intentionally trivial — Markdown formatting is a host
 * concern. Apps that need real Markdown rendering swap this for a renderer
 * piping `widget.snapshot.contentLocalizationKey` through their preferred
 * library (`react-markdown`, MDX, …).
 */
export function MarkdownSnapshotWidget({ widget }: { readonly widget: DashboardRenderedWidget }) {
  const { t } = useTranslation();
  if (!isMarkdownSnapshotEnvelope(widget) || !widget.snapshot) return null;
  const content = t(widget.snapshot.contentLocalizationKey, {
    defaultValue: widget.snapshot.contentLocalizationKey,
  });
  return (
    <div data-slot="markdown-snapshot-widget" className="whitespace-pre-wrap break-words text-sm">
      {content}
    </div>
  );
}
