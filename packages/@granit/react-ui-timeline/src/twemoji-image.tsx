import { cn } from '@granit/utils';
import { useState, type CSSProperties } from 'react';


// Pinned jsdelivr CDN. Twemoji 14.x is the last "official" Twitter
// drop; jdecked/twemoji is the community-maintained successor that
// tracks new Unicode emoji versions.
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg';

const ZWJ = '‍';
const VS16 = '️';

// Mirror jdecked/twemoji's `grabTheRightIcon`:
//  - VS-16 (U+FE0F) is stripped from sequences WITHOUT a ZWJ.
//  - It must be PRESERVED when a ZWJ is present (otherwise families
//    like `👨‍👩‍👧` map to the wrong asset).
//  - Surrogate pairs fold back into astral codepoints via the
//    `for…of` iteration on strings.
//
// Examples:
//   '👍'              → '1f44d'
//   '1️⃣'             → '31-20e3'
//   '👨‍👩‍👧'       → '1f468-200d-1f469-200d-1f467'
//   '👍🏽'            → '1f44d-1f3fd'
//
// Exported for test access only.
export function emojiToTwemojiCodepoints(emoji: string): string {
  const normalized = emoji.includes(ZWJ) ? emoji : emoji.replaceAll(VS16, '');
  const out: string[] = [];
  for (const ch of normalized) {
    const cp = ch.codePointAt(0);
    if (cp !== undefined) out.push(cp.toString(16));
  }
  return out.join('-');
}

export interface TwemojiImageProps {
  /** Literal emoji glyph — any well-formed Extended_Pictographic sequence. */
  readonly emoji: string;
  /** Side length in CSS pixels (square). Defaults to `18`. */
  readonly size?: number;
  readonly className?: string;
  readonly style?: CSSProperties;
}

// Render an emoji as a Twemoji SVG image served from the jdecked/twemoji
// jsdelivr CDN. Cross-OS-consistent glyph rendering without bundling
// the sprite. The `<img>` tag uses native lazy decoding so a strip of
// many reactions doesn't block paint.
//
// Fallback: the CDN occasionally lacks an asset (notably for ZWJ
// sequences that ship from the backend stripped of VS-16 — the
// `NormalizeForAggregate` rule on `EmojiValidator` collapses skin-tone
// and presentation-selector variants for aggregation, but Twemoji's
// filenames use the fully-qualified RGI form). When the SVG 404s,
// swap to native glyph rendering inline so the user never sees a
// broken-image icon.
//
// CSP requirement: the app must allow `img-src https://cdn.jsdelivr.net`.
// No `connect-src` needed — `<img>` doesn't use fetch.
export function TwemojiImage({ emoji, size = 18, className, style }: TwemojiImageProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <span
        role="img"
        data-slot="twemoji-image"
        aria-label={emoji}
        data-emoji={emoji}
        className={cn('inline-block select-none align-text-bottom leading-none', className)}
        style={{ fontSize: size, lineHeight: `${size}px`, ...style }}
      >
        {emoji}
      </span>
    );
  }

  const codepoints = emojiToTwemojiCodepoints(emoji);
  return (
    <img
      src={`${CDN_BASE}/${codepoints}.svg`}
      alt={emoji}
      role="img"
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      draggable={false}
      data-emoji={emoji}
      onError={() => setErrored(true)}
      className={cn('inline-block select-none align-text-bottom', className)}
      style={style}
    />
  );
}
