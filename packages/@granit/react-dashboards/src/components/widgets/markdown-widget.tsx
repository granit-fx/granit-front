import { useTranslation } from 'react-i18next';

import type { MarkdownWidgetDefinition } from '@granit/dashboards';

/**
 * Built-in renderer for `MarkdownWidgetDefinition`.
 *
 * v1 ships a minimal pre-formatted fallback — the resolved Markdown renders
 * verbatim with whitespace preserved. To enable full Markdown rendering
 * (headings, lists, code blocks, links), apps register their own renderer in
 * the registry, typically backed by `react-markdown`. Keeping the fallback
 * dependency-free means `@granit/react-dashboards` doesn't drag react-markdown
 * into bundles that never use it.
 *
 * The widget's `contentLocalizationKey` is resolved directly via
 * `useTranslation()` — the backend ships the key fully composed
 * (`Widget:{DashboardName}.{Slug}`).
 */
export function MarkdownWidget({ widget }: { readonly widget: MarkdownWidgetDefinition }) {
  const { t } = useTranslation();
  const content = t(widget.contentLocalizationKey);
  return (
    <div data-slot="markdown-widget" className="prose prose-sm max-w-none">
      <pre className="whitespace-pre-wrap break-words font-sans text-sm text-foreground">
        {content}
      </pre>
    </div>
  );
}
