import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { emojiToTwemojiCodepoints, TwemojiImage } from './twemoji-image';

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg';

describe('emojiToTwemojiCodepoints', () => {
  it('maps a simple single-codepoint emoji', () => {
    expect(emojiToTwemojiCodepoints('👍')).toBe('1f44d');
  });

  it('strips VS-16 from a sequence without a ZWJ (keycap)', () => {
    expect(emojiToTwemojiCodepoints('1️⃣')).toBe('31-20e3');
  });

  it('preserves VS-16 and ZWJ in a family sequence', () => {
    expect(emojiToTwemojiCodepoints('👨‍👩‍👧')).toBe('1f468-200d-1f469-200d-1f467');
  });

  it('keeps skin-tone modifiers (no VS-16 present)', () => {
    expect(emojiToTwemojiCodepoints('👍🏽')).toBe('1f44d-1f3fd');
  });

  it('returns an empty string for an empty input', () => {
    expect(emojiToTwemojiCodepoints('')).toBe('');
  });
});

describe('TwemojiImage', () => {
  it('renders an <img> pointing at the CDN with default size', () => {
    const { getByRole } = render(<TwemojiImage emoji="👍" />);
    const img = getByRole('img') as HTMLImageElement;
    expect(img.tagName).toBe('IMG');
    expect(img.getAttribute('src')).toBe(`${CDN_BASE}/1f44d.svg`);
    expect(img.getAttribute('alt')).toBe('👍');
    expect(img.getAttribute('data-emoji')).toBe('👍');
    expect(img.getAttribute('width')).toBe('18');
    expect(img.getAttribute('height')).toBe('18');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('decoding')).toBe('async');
    expect(img.getAttribute('draggable')).toBe('false');
  });

  it('honours a custom size', () => {
    const { getByRole } = render(<TwemojiImage emoji="👍" size={32} />);
    const img = getByRole('img');
    expect(img.getAttribute('width')).toBe('32');
    expect(img.getAttribute('height')).toBe('32');
  });

  it('merges a custom className and applies inline style', () => {
    const { getByRole } = render(
      <TwemojiImage emoji="👍" className="my-emoji" style={{ opacity: 0.5 }} />
    );
    const img = getByRole('img');
    expect(img.className).toContain('my-emoji');
    expect(img.className).toContain('inline-block');
    expect((img as HTMLElement).style.opacity).toBe('0.5');
  });

  it('renders the img with no inline style when style prop is absent', () => {
    const { getByRole } = render(<TwemojiImage emoji="👍" />);
    const img = getByRole('img');
    expect(img.getAttribute('style')).toBeNull();
  });

  it('falls back to a native glyph <span> when the SVG errors', () => {
    const { getByRole, container } = render(<TwemojiImage emoji="👍" />);
    const img = getByRole('img');
    fireEvent.error(img);

    const span = container.querySelector('[data-slot="twemoji-image"]');
    expect(span).not.toBeNull();
    expect(span?.tagName).toBe('SPAN');
    expect(span?.getAttribute('aria-label')).toBe('👍');
    expect(span?.getAttribute('data-emoji')).toBe('👍');
    expect(span?.textContent).toBe('👍');
    expect(container.querySelector('img')).toBeNull();
  });

  it('applies size and merged className/style on the fallback span', () => {
    const { getByRole, container } = render(
      <TwemojiImage emoji="🎉" size={24} className="fallback-cls" style={{ color: 'red' }} />
    );
    fireEvent.error(getByRole('img'));

    const span = container.querySelector('[data-slot="twemoji-image"]') as HTMLElement;
    expect(span.className).toContain('fallback-cls');
    expect(span.style.fontSize).toBe('24px');
    expect(span.style.lineHeight).toBe('24px');
    expect(span.style.color).toBe('red');
  });
});
