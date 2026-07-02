import { useWidgetTriggerHandler } from '@granit/react-dashboards';
import { useTranslation } from '@granit/react-localization';

import { DashboardMarkdown } from './dashboard-markdown';

import type { MarkdownWidgetDefinition } from '@granit/dashboards';

/**
 * Definition-side `markdown` renderer that actually parses Markdown — the
 * rich counterpart to the verbatim fallback in `@granit/react-dashboards`.
 * Register it via {@link markdownWidgetRegistry} (composed after
 * `defaultWidgetRegistry`) so the editor preview and fixture-driven demos
 * render headings/lists/tables instead of raw `##`.
 *
 * `Click` actions on `widget.actions` fire on body click via
 * {@link useWidgetTriggerHandler}; the interactive affordances (cursor,
 * `role`, keyboard) apply only when at least one Click action is wired.
 */
export function RichMarkdownWidget({ widget }: { readonly widget: MarkdownWidgetDefinition }) {
  const { t } = useTranslation();
  const content = t(widget.contentLocalizationKey, { defaultValue: widget.contentLocalizationKey });
  const onClick = useWidgetTriggerHandler('Click', widget.actions);

  if (onClick) {
    return (
      <button
        type="button"
        data-slot="markdown-widget"
        data-interactive=""
        onClick={() => onClick()}
        className="w-full cursor-pointer border-0 bg-transparent p-0 text-left"
      >
        <DashboardMarkdown content={content} />
      </button>
    );
  }
  return <DashboardMarkdown content={content} />;
}
