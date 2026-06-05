import { describe, expect, it } from 'vitest';

import { isIdempotencyTombstoned, isIdempotentReplay, readIdempotencyTombstone } from '../idempotency';

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

// Builds an AxiosResponse-shaped object exposing `headers` directly (success
// path), as opposed to the error wrapper above (`response.headers`).
function responseWithHeaders(headers: Record<string, string>, status = 200): unknown {
  return { status, statusText: 'OK', headers, data: {} };
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

describe('isIdempotentReplay', () => {
  it('is true when a success response carries the replay header', () => {
    const res = responseWithHeaders({ 'idempotent-replayed': 'true' });

    expect(isIdempotentReplay(res)).toBe(true);
  });

  it('is true for the canonical-cased header', () => {
    // Axios normally lowercases headers, but a proxy or test fixture may not.
    const res = responseWithHeaders({ 'Idempotent-Replayed': 'true' });

    expect(isIdempotentReplay(res)).toBe(true);
  });

  it('is true when the replay reproduces a cached error status (error shape)', () => {
    // Cacheable error statuses (e.g. 409, 422) are replayed too — the helper
    // must read `error.response.headers`, not just `response.headers`.
    const err = errorWithHeaders({ 'idempotent-replayed': 'true' }, 409);

    expect(isIdempotentReplay(err)).toBe(true);
  });

  it('is false when the replay header is absent', () => {
    const res = responseWithHeaders({ 'content-type': 'application/json' });

    expect(isIdempotentReplay(res)).toBe(false);
  });

  it('is false when the replay header is not "true"', () => {
    const res = responseWithHeaders({ 'idempotent-replayed': 'false' });

    expect(isIdempotentReplay(res)).toBe(false);
  });

  it('is false for non-object input', () => {
    expect(isIdempotentReplay(null)).toBe(false);
    expect(isIdempotentReplay(undefined)).toBe(false);
    expect(isIdempotentReplay('true')).toBe(false);
    expect(isIdempotentReplay({})).toBe(false);
  });
});
