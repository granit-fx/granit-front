import { cn } from '@granit/utils';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { Components } from 'react-markdown';

export interface ChatMarkdownProps {
  /**
   * Markdown source. ⚠️ **Untrusted** — this is assistant-generated output. It is
   * rendered to an escaped React element tree by `react-markdown` (no
   * `rehype-raw`), so raw HTML in the source is emitted as literal text, never as
   * live DOM. This is not an HTML sink.
   */
  readonly content: string;
  readonly className?: string;
}

/**
 * Styled element overrides for the rendered tree. Tokens are semantic Tailwind
 * classes (`bg-muted`, `text-primary`, `border-border`…) so the consuming app's
 * theme drives the palette — never hard-coded colours. The consuming showcase
 * scans the `react-*` package sources via `@source`, so these utilities are
 * emitted downstream.
 */
const components: Components = {
  p: ({ children }) => <p className="[&:not(:first-child)]:mt-2">{children}</p>,
  // Links carry untrusted text and hrefs: open out-of-document and strip the
  // opener + referrer, and tell crawlers not to confer rank (`nofollow`).
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-primary underline"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="[&:not(:first-child)]:mt-2 list-disc pl-5">{children}</ul>,
  ol: ({ children }) => (
    <ol className="[&:not(:first-child)]:mt-2 list-decimal pl-5">{children}</ol>
  ),
  li: ({ children }) => <li className="mt-1">{children}</li>,
  h1: ({ children }) => (
    <h1 className="[&:not(:first-child)]:mt-3 text-base font-semibold">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="[&:not(:first-child)]:mt-3 text-base font-semibold">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="[&:not(:first-child)]:mt-2 text-sm font-semibold">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="[&:not(:first-child)]:mt-2 text-sm font-semibold">{children}</h4>
  ),
  blockquote: ({ children }) => (
    <blockquote className="[&:not(:first-child)]:mt-2 border-border text-muted-foreground border-l-2 pl-3">
      {children}
    </blockquote>
  ),
  // Distinguish inline code from a fenced block by the `language-*` class
  // `remark`/`micromark` puts on the inner `<code>` of a fence. Inline code is
  // self-contained (own surface); fenced code defers its surface to `pre`.
  code: ({ className: codeClassName, children }) =>
    codeClassName?.includes('language-') ? (
      <code className={cn('font-mono text-xs', codeClassName)}>{children}</code>
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
 * Renders assistant Markdown as a safe, escaped React element tree.
 *
 * Uses `react-markdown` + `remark-gfm` **without** `rehype-raw`: raw HTML in the
 * source is escaped to text rather than parsed into DOM, so this stays within the
 * "no HTML sink" rule of {@link ChatMessage}. Styling is supplied through the
 * `components` map with semantic Tailwind tokens — no hard-coded colours.
 */
export function ChatMarkdown({ content, className }: Readonly<ChatMarkdownProps>) {
  return (
    <div data-slot="chat-markdown" className={cn('text-sm break-words', className)}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  );
}
