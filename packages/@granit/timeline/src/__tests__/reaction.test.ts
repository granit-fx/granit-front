import { describe, expect, it } from 'vitest';

import { parseReactionEmoji, toReactionEmoji } from '../utils/reaction-utils';

describe('toReactionEmoji', () => {
  it('returns the input value (brand is erased at runtime)', () => {
    expect(toReactionEmoji('👍')).toBe('👍');
  });
});

describe('parseReactionEmoji', () => {
  it.each([
    ['plain emoji', '👍'],
    ['emoji with VS-16', '❤️'],
    ['skin-tone modifier', '👍🏽'],
    ['ZWJ family sequence', '👨‍👩‍👧'],
    ['keycap sequence', '1️⃣'],
    ['rocket', '🚀'],
    ['fire', '🔥'],
    ['country flag — Belgium (RI pair)', '🇧🇪'],
    ['country flag — France (RI pair)', '🇫🇷'],
    ['country flag — United States (RI pair)', '🇺🇸'],
    ['subdivision flag — England (tag sequence)', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'],
    ['subdivision flag — Scotland (tag sequence)', '🏴󠁧󠁢󠁳󠁣󠁴󠁿'],
    ['subdivision flag — Wales (tag sequence)', '🏴󠁧󠁢󠁷󠁬󠁳󠁿'],
  ])('accepts a well-formed %s', (_label, value) => {
    expect(parseReactionEmoji(value)).toBe(value);
  });

  it.each([
    ['empty string', ''],
    ['plain letter', 'a'],
    ['plain digit (no keycap combiner)', '1'],
    ['short name fallback (legacy wire)', 'thumbs_up'],
    ['multiple emojis concatenated without ZWJ', '👍👎'],
    ['single Regional Indicator without partner', '🇧'],
    ['tag sequence missing cancel-tag terminator', '🏴󠁧󠁢󠁥󠁮󠁧'],
    ['tag chars without a pictographic base', '󠁧󠁢󠁥󠁮󠁧󠁿'],
    ['contains a control char', ''],
  ])('rejects malformed input — %s', (_label, value) => {
    expect(parseReactionEmoji(value)).toBeNull();
  });

  it('rejects values longer than 32 chars (defense against blob-stuffing)', () => {
    expect(parseReactionEmoji('👍'.repeat(20))).toBeNull();
  });
});
