import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { Components } from 'react-markdown';

export interface DashboardMarkdownProps {
  /**
   * Markdown source resolved from a widget's localization key (e.g. a
   * dashboard banner's `## Tiers`). Trusted, host-authored content — but still
   * rendered to an escaped React element tree by `react-markdown` **without**
   * `rehype-raw`, so raw HTML in the source is emitted as literal text, never
   * as live DOM. This is not an HTML sink (no `check:csp` subpath required).
   */
  readonly content: string;
  readonly className?: string;
}

/**
 * Element overrides tuned for dashboard content — headings read larger than
 * the chat surface since banners double as section titles. Colours are
 * semantic Tailwind tokens (`text-foreground`, `text-muted-foreground`,
 * `border-border`…) so the consuming app's theme drives the palette.
 */
const components: Components = {
  p: ({ children }) => (
    <p className="[&:not(:first-child)]:mt-2 text-sm text-foreground">{children}</p>
  ),
  // Links carry host content but still open out-of-document, stripping the
  // opener + referrer.
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="[&:not(:first-child)]:mt-2 list-disc pl-5 text-sm text-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="[&:not(:first-child)]:mt-2 list-decimal pl-5 text-sm text-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="mt-1">{children}</li>,
  h1: ({ children }) => (
    <h1 className="[&:not(:first-child)]:mt-3 text-xl font-semibold tracking-tight text-foreground">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="[&:not(:first-child)]:mt-3 text-lg font-semibold text-foreground">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="[&:not(:first-child)]:mt-2 text-base font-semibold text-foreground">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="[&:not(:first-child)]:mt-2 text-sm font-semibold text-foreground">
      {children}
    </h4>
  ),
  blockquote: ({ children }) => (
    <blockquote className="[&:not(:first-child)]:mt-2 border-border text-muted-foreground border-l-2 pl-3">
      {children}
    </blockquote>
  ),
  // Distinguish inline code from a fenced block by the `language-*` class
  // `remark`/`micromark` puts on the inner `<code>` of a fence.
  code: ({ className: codeClassName, children }) =>
    codeClassName?.includes('language-') ? (
      <code className={`font-mono text-xs ${codeClassName}`}>{children}</code>
    ) : (
      <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">{children}</code>
    ),
  pre: ({ children }) => (
    <pre className="bg-muted [&:not(:first-child)]:mt-2 overflow-x-auto rounded-md p-2 font-mono text-xs">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="[&:not(:first-child)]:mt-2 overflow-x-auto">
      <table className="border-border w-full border-collapse border text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-border bg-muted border px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border-border border px-2 py-1">{children}</td>,
  hr: () => <hr className="border-border my-3" />,
};

/**
 * Renders dashboard widget Markdown as a safe, escaped React element tree.
 *
 * Drop-in replacement for the verbatim `<pre>`/`<div>` fallbacks the headless
 * `@granit/react-dashboards` ships for `markdown` widgets — those keep
 * react-markdown out of bundles that never render Markdown. Apps that want
 * real Markdown compose {@link markdownWidgetRegistry} /
 * {@link markdownSnapshotWidgetRegistry} on top of the framework defaults.
 *
 * Uses `react-markdown` + `remark-gfm` **without** `rehype-raw`: raw HTML in
 * the source is escaped to text rather than parsed into DOM.
 */
export function DashboardMarkdown({ content, className }: Readonly<DashboardMarkdownProps>) {
  return (
    <div data-slot="dashboard-markdown" className={`break-words ${className ?? ''}`.trim()}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  );
}
