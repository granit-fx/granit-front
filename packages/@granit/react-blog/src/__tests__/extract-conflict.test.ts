import { describe, expect, it } from 'vitest';

import { extractBlogConflict } from '../lib/extract-conflict';

describe('extractBlogConflict', () => {
  it('returns null for non-409 and non-response errors', () => {
    expect(extractBlogConflict(new Error('x'))).toBeNull();
    expect(extractBlogConflict({ response: { status: 500 } })).toBeNull();
    expect(extractBlogConflict(null)).toBeNull();
  });

  it('parses a 409 problem+json body, surfacing the localized detail', () => {
    const conflict = extractBlogConflict({
      response: { status: 409, data: { detail: 'That slug is already in use.' } },
    });
    expect(conflict).toEqual({ status: 409, detail: 'That slug is already in use.' });
  });

  it('tolerates a 409 with no detail', () => {
    expect(extractBlogConflict({ response: { status: 409, data: {} } })).toEqual({
      status: 409,
      detail: null,
    });
  });
});
