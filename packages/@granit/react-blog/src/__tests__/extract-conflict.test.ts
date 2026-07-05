import { BlogErrorCodes } from '@granit/blog';
import { describe, expect, it } from 'vitest';

import { extractBlogConflict, isBlogConcurrencyConflict } from '../lib/extract-conflict';

describe('extractBlogConflict', () => {
  it('returns null for non-409 and non-response errors', () => {
    expect(extractBlogConflict(new Error('x'))).toBeNull();
    expect(extractBlogConflict({ response: { status: 500 } })).toBeNull();
    expect(extractBlogConflict(null)).toBeNull();
  });

  it('parses a 409 problem+json body', () => {
    const conflict = extractBlogConflict({
      response: { status: 409, data: { code: BlogErrorCodes.PostSlugConflict, detail: 'taken' } },
    });
    expect(conflict).toEqual({
      status: 409,
      code: BlogErrorCodes.PostSlugConflict,
      detail: 'taken',
    });
  });

  it('detects concurrency conflicts', () => {
    expect(
      isBlogConcurrencyConflict({
        response: { status: 409, data: { code: BlogErrorCodes.DraftConcurrency } },
      })
    ).toBe(true);
    expect(
      isBlogConcurrencyConflict({
        response: { status: 409, data: { code: BlogErrorCodes.StalePost } },
      })
    ).toBe(true);
    expect(
      isBlogConcurrencyConflict({
        response: { status: 409, data: { code: BlogErrorCodes.PostSlugConflict } },
      })
    ).toBe(false);
  });
});
