import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * The three clipboard flavours offered for a chat message. Assistant content is
 * Markdown, so each flavour targets a different paste destination:
 *
 * - `html` — rendered, sanitised HTML for rich-text targets (Docs, Gmail…).
 * - `markdown` — the verbatim Markdown source (Notion re-parses it on paste).
 * - `plain` — all formatting stripped to bare text.
 */
export type CopyFormat = 'html' | 'markdown' | 'plain';

// Render Markdown synchronously to an HTML fragment (GFM on, no async plugins).
function renderHtml(markdown: string): string {
  return marked.parse(markdown, { async: false, gfm: true });
}

/**
 * Convert a Markdown message to the requested clipboard representation.
 *
 * ⚠️ The source is **untrusted** assistant output. The HTML branch runs through
 * {@link DOMPurify} before it ever reaches the clipboard, so a paste target can
 * never receive live `<script>`/event-handler markup. The plain branch strips to
 * text content (no tags, no attributes).
 */
export function markdownToClipboard(markdown: string, format: CopyFormat): string {
  switch (format) {
    case 'markdown':
      return markdown;
    case 'plain':
      return DOMPurify.sanitize(renderHtml(markdown), {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      }).trim();
    case 'html':
      return DOMPurify.sanitize(renderHtml(markdown)).trim();
  }
}

/**
 * Write a chat message to the clipboard in the requested {@link CopyFormat}.
 *
 * For `html` we publish a {@link ClipboardItem} carrying both `text/html` (rich)
 * and `text/plain` (degraded fallback) so targets that ignore HTML still get
 * readable text. The other formats are plain-text writes. Rejects on clipboard
 * failure so the caller can surface an error toast.
 */
export async function copyMessage(markdown: string, format: CopyFormat): Promise<void> {
  if (format === 'html' && typeof ClipboardItem !== 'undefined') {
    const html = markdownToClipboard(markdown, 'html');
    const plain = markdownToClipboard(markdown, 'plain');
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      }),
    ]);
    return;
  }

  await navigator.clipboard.writeText(markdownToClipboard(markdown, format));
}
