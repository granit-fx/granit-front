import { useTranslation } from 'react-i18next';

import { useWidgetTriggerHandler } from '../../hooks/use-widget-trigger-handler.js';

import type { MarkdownWidgetDefinition } from '@granit/dashboards';

/**
 * Built-in renderer for `MarkdownWidgetDefinition`.
 *
 * v1 ships a minimal pre-formatted fallback — the resolved Markdown
 * renders verbatim with whitespace preserved. Full Markdown rendering
 * (headings, lists, code blocks, links) is opt-in via a downstream
 * renderer registered in the registry, typically backed by
 * `react-markdown`. Keeping the fallback dependency-free means
 * `@granit/react-dashboards` doesn't drag react-markdown into bundles
 * that never use it.
 *
 * `Click` actions declared on `widget.actions` fire on body click via
 * {@link useWidgetTriggerHandler}. Cursor + role + keyboard
 * affordances apply only when at least one Click action is wired —
 * widgets without actions stay non-interactive.
 */
export function MarkdownWidget({ widget }: { readonly widget: MarkdownWidgetDefinition }) {
  const { t } = useTranslation();
  const content = t(widget.contentLocalizationKey);
  const onClick = useWidgetTriggerHandler('Click', widget.actions);
  const inner = (
    <pre className="whitespace-pre-wrap break-words font-sans text-sm text-foreground">
      {content}
    </pre>
  );

  if (onClick) {
    return (
      <button
        type="button"
        data-slot="markdown-widget"
        data-interactive=""
        onClick={() => onClick()}
        className="prose prose-sm max-w-none cursor-pointer text-left bg-transparent border-0 p-0 w-full"
      >
        {inner}
      </button>
    );
  }
  return (
    <div data-slot="markdown-widget" className="prose prose-sm max-w-none">
      {inner}
    </div>
  );
}
