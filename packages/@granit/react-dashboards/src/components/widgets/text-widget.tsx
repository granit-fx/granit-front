import type { TextWidgetDefinition } from '@granit/dashboards';

/**
 * Built-in renderer for `TextWidgetDefinition`.
 *
 * Whitespace is preserved so multi-line text reads as authored. For richer
 * formatting (lists, headings, links) hosts should register a Markdown
 * renderer instead — Text is the lowest-fidelity widget, intentionally.
 */
export function TextWidget({ widget }: { readonly widget: TextWidgetDefinition }) {
  return (
    <p data-slot="text-widget" className="whitespace-pre-wrap break-words text-sm text-foreground">
      {widget.content}
    </p>
  );
}
