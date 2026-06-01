import { describe, expect, it } from 'vitest';

import {
  classifyMergeError,
  generateMergeIdempotencyKey,
  resolveWinner,
  seedFieldChoices,
} from '../helpers';

import type { FieldConflict } from '../types/index';

const conflicts: readonly FieldConflict[] = [
  { fieldPath: 'Name', survivorValue: 'A', loserValue: 'B', default: 'Survivor' },
  { fieldPath: 'Tax', survivorValue: null, loserValue: 'X', default: 'Loser' },
];

describe('generateMergeIdempotencyKey', () => {
  it('returns a UUID-shaped string', () => {
    expect(generateMergeIdempotencyKey()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('returns distinct keys on successive calls', () => {
    expect(generateMergeIdempotencyKey()).not.toBe(generateMergeIdempotencyKey());
  });
});

describe('seedFieldChoices', () => {
  it('seeds the recommended default for unseen field paths', () => {
    expect(seedFieldChoices(conflicts, {})).toEqual({ Name: 'Survivor', Tax: 'Loser' });
  });

  it('preserves manual edits while seeding the rest', () => {
    expect(seedFieldChoices(conflicts, { Name: 'Loser' })).toEqual({ Name: 'Loser', Tax: 'Loser' });
  });

  it('returns the same reference when every field is already present', () => {
    const previous = { Name: 'Survivor', Tax: 'Loser' } as const;
    expect(seedFieldChoices(conflicts, previous)).toBe(previous);
  });

  it('returns the same reference for an empty conflict list', () => {
    const previous = {};
    expect(seedFieldChoices([], previous)).toBe(previous);
  });
});

describe('resolveWinner', () => {
  it('uses the explicit override when present', () => {
    expect(resolveWinner(conflicts[0]!, { Name: 'Loser' })).toBe('Loser');
  });

  it('falls back to the recommended default', () => {
    expect(resolveWinner(conflicts[0]!, {})).toBe('Survivor');
  });
});

describe('classifyMergeError', () => {
  const httpError = (status: number, data?: unknown) => ({ response: { status, data } });

  it('maps 409 to conflict', () => {
    expect(classifyMergeError(httpError(409)).kind).toBe('conflict');
  });

  it('maps 422 to domain and surfaces the detail + status', () => {
    const classified = classifyMergeError(httpError(422, { detail: 'Currency mismatch' }));
    expect(classified).toEqual({ kind: 'domain', detail: 'Currency mismatch', status: 422 });
  });

  it('maps 404 to notFound', () => {
    expect(classifyMergeError(httpError(404)).kind).toBe('notFound');
  });

  it('maps 400 to validation', () => {
    expect(classifyMergeError(httpError(400)).kind).toBe('validation');
  });

  it('falls back to title when detail is absent', () => {
    expect(classifyMergeError(httpError(500, { title: 'Internal Server Error' })).detail).toBe(
      'Internal Server Error'
    );
  });

  it('maps an unrecognized status to unknown', () => {
    expect(classifyMergeError(httpError(503)).kind).toBe('unknown');
  });

  it('handles a non-HTTP error', () => {
    expect(classifyMergeError(new Error('boom'))).toEqual({
      kind: 'unknown',
      detail: null,
      status: null,
    });
  });

  it('handles null', () => {
    expect(classifyMergeError(null)).toEqual({ kind: 'unknown', detail: null, status: null });
  });
});
