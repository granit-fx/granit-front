import { describe, expect, it } from 'vitest';

import { isIdempotencyTombstoned, readIdempotencyTombstone } from '../idempotency.js';

// Builds an AxiosError-shaped object with the given response headers.
// We intentionally do NOT use the real `AxiosError` constructor — the
// helpers accept any error shape exposing `response.headers`, and this
// test documents that contract.
function errorWithHeaders(headers: Record<string, string>, status = 413): unknown {
  return {
    response: {
      status,
      statusText: 'Payload Too Large',
      headers,
    },
    message: 'Request failed',
  };
}

describe('readIdempotencyTombstone', () => {
  it('returns the reason when the lowercase header is present', () => {
    const err = errorWithHeaders({ 'x-idempotency-tombstone': 'ResponseTooLarge' });

    expect(readIdempotencyTombstone(err)).toEqual({ reason: 'ResponseTooLarge' });
  });

  it('returns the reason when the canonical-cased header is present', () => {
    // Axios normally lowercases headers, but a proxy or test fixture may not.
    const err = errorWithHeaders({ 'X-Idempotency-Tombstone': 'ResponseTooLarge' });

    expect(readIdempotencyTombstone(err)).toEqual({ reason: 'ResponseTooLarge' });
  });

  it('preserves unknown reasons so future backend values are not lost', () => {
    // The backend may add new IdempotencyTombstoneReason variants (e.g.
    // NonDeterministicResponse). The helper must not filter them.
    const err = errorWithHeaders({ 'x-idempotency-tombstone': 'SomeFutureReason' });

    expect(readIdempotencyTombstone(err)).toEqual({ reason: 'SomeFutureReason' });
  });

  it('returns undefined when the header is missing', () => {
    const err = errorWithHeaders({ 'content-type': 'application/problem+json' });

    expect(readIdempotencyTombstone(err)).toBeUndefined();
  });

  it('returns undefined when the header value is empty', () => {
    const err = errorWithHeaders({ 'x-idempotency-tombstone': '' });

    expect(readIdempotencyTombstone(err)).toBeUndefined();
  });

  it('returns undefined for non-error values', () => {
    expect(readIdempotencyTombstone(null)).toBeUndefined();
    expect(readIdempotencyTombstone(undefined)).toBeUndefined();
    expect(readIdempotencyTombstone('some string')).toBeUndefined();
    expect(readIdempotencyTombstone(new Error('plain error'))).toBeUndefined();
    expect(readIdempotencyTombstone({})).toBeUndefined();
  });

  it('returns undefined when response is present but has no headers', () => {
    const err = { response: { status: 413 } };

    expect(readIdempotencyTombstone(err)).toBeUndefined();
  });
});

describe('isIdempotencyTombstoned', () => {
  it('is true when a reason is reported', () => {
    const err = errorWithHeaders({ 'x-idempotency-tombstone': 'ResponseTooLarge' });

    expect(isIdempotencyTombstoned(err)).toBe(true);
  });

  it('is false for a regular 413 without the tombstone header', () => {
    // A plain Payload-Too-Large from a different source (e.g. Kestrel max
    // request body) must NOT be misidentified as a tombstone.
    const err = errorWithHeaders({ 'content-length': '0' });

    expect(isIdempotencyTombstoned(err)).toBe(false);
  });

  it('is false for a 409 in-progress response', () => {
    // The Idempotency middleware returns 409 on in-progress / race — those
    // are retryable, unlike the 413 tombstone.
    const err = errorWithHeaders({ 'retry-after': '30' }, 409);

    expect(isIdempotencyTombstoned(err)).toBe(false);
  });

  it('is false for non-error input', () => {
    expect(isIdempotencyTombstoned(null)).toBe(false);
    expect(isIdempotencyTombstoned(new Error('network'))).toBe(false);
  });
});
