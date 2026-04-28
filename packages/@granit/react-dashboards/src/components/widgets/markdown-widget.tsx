import type { MarkdownWidgetDefinition } from '@granit/dashboards';

/**
 * Built-in renderer for `MarkdownWidgetDefinition`.
 *
 * v1 ships a minimal pre-formatted fallback — content renders verbatim with
 * whitespace preserved. To enable full Markdown rendering (headings, lists,
 * code blocks, links), apps register their own renderer in the registry,
 * typically backed by `react-markdown`. Keeping the fallback dependency-free
 * means `@granit/react-dashboards` doesn't drag react-markdown into bundles
 * that never use it.
 */
export function MarkdownWidget({ widget }: { readonly widget: MarkdownWidgetDefinition }) {
  return (
    <div data-slot="markdown-widget" className="prose prose-sm max-w-none">
      <pre className="whitespace-pre-wrap break-words font-sans text-sm text-foreground">
        {widget.content}
      </pre>
    </div>
  );
}
