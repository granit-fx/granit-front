import { describe, expect, it } from 'vitest';

import { markdownToClipboard } from '../components/chat-clipboard';

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
