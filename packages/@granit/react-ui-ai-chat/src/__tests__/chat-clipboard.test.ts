import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { copyMessage, markdownToClipboard } from '../components/chat-clipboard';

describe('markdownToClipboard', () => {
  const source = '# Title\n\nHello **world** with `code` and a [link](https://example.com).';

  it('returns the verbatim source for the markdown format', () => {
    expect(markdownToClipboard(source, 'markdown')).toBe(source);
  });

  it('renders sanitised HTML for the html format', () => {
    const html = markdownToClipboard(source, 'html');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>world</strong>');
    expect(html).toContain('<code>code</code>');
    expect(html).toContain('<a href="https://example.com">link</a>');
  });

  it('strips all formatting for the plain format', () => {
    const plain = markdownToClipboard(source, 'plain');
    expect(plain).toContain('Title');
    expect(plain).toContain('Hello world with code and a link.');
    expect(plain).not.toContain('#');
    expect(plain).not.toContain('**');
    expect(plain).not.toContain('<');
  });

  it('neutralises untrusted HTML in the assistant content', () => {
    const malicious = 'before <img src=x onerror="alert(1)"> <script>alert(2)</script> after';
    const html = markdownToClipboard(malicious, 'html');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('<script');
    expect(markdownToClipboard(malicious, 'plain')).not.toContain('alert');
  });
});

describe('copyMessage', () => {
  // jsdom provides no Clipboard API by default; install spy-able stubs.
  const write = vi.fn<(items: readonly unknown[]) => Promise<void>>().mockResolvedValue(undefined);
  const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.stubGlobal('navigator', { clipboard: { write, writeText } });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('publishes a rich ClipboardItem (html + plain fallback) for the html format', async () => {
    // jsdom lacks ClipboardItem; stub it so the rich-write branch is taken.
    class FakeClipboardItem {
      constructor(public readonly parts: Record<string, Blob>) {}
    }
    vi.stubGlobal('ClipboardItem', FakeClipboardItem);

    await copyMessage('# Hi\n\n**bold**', 'html');

    expect(write).toHaveBeenCalledTimes(1);
    expect(writeText).not.toHaveBeenCalled();
    const [items] = write.mock.calls[0]!;
    const [item] = items as FakeClipboardItem[];
    expect(item!.parts['text/html']).toBeInstanceOf(Blob);
    expect(item!.parts['text/plain']).toBeInstanceOf(Blob);
  });

  it('falls back to writeText when ClipboardItem is unavailable', async () => {
    vi.stubGlobal('ClipboardItem', undefined);

    await copyMessage('# Hi', 'html');

    expect(write).not.toHaveBeenCalled();
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0]![0]).toContain('<h1>Hi</h1>');
  });

  it('writes plain text directly for the markdown and plain formats', async () => {
    vi.stubGlobal('ClipboardItem', undefined);

    await copyMessage('# Hi', 'markdown');
    expect(writeText).toHaveBeenLastCalledWith('# Hi');

    await copyMessage('# Hi', 'plain');
    expect(writeText).toHaveBeenLastCalledWith('Hi');
  });
});
