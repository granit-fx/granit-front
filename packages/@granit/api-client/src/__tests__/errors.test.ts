import { describe, expect, it } from 'vitest';

import {
  ConcurrencyConflictError,
  getHttpStatus,
  HttpError,
  isBackendUnavailable,
  isConcurrencyConflict,
  TimeoutError,
  ValidationError,
} from '../errors';

describe('HttpError', () => {
  it('should set name, message, and status', () => {
    const error = new HttpError('Not Found', 404);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('HttpError');
    expect(error.message).toBe('Not Found');
    expect(error.status).toBe(404);
    expect(error.problemDetails).toBeUndefined();
  });

  it('should attach problemDetails when provided', () => {
    const details = { title: 'Conflict', status: 409, detail: 'Already exists' };
    const error = new HttpError('Conflict', 409, details);

    expect(error.status).toBe(409);
    expect(error.problemDetails).toEqual(details);
  });
});

describe('ValidationError', () => {
  it('should set name and message', () => {
    const error = new ValidationError('Invalid input');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Invalid input');
    expect(error.details).toBeUndefined();
  });

  it('should attach validation details when provided', () => {
    const details = {
      field: 'email',
      constraint: 'Must be a valid email',
      fieldErrors: { email: ['Invalid format'] },
    };
    const error = new ValidationError('Validation failed', details);

    expect(error.details).toEqual(details);
  });
});

describe('ConcurrencyConflictError', () => {
  it('is an HttpError fixed to status 409', () => {
    const details = { title: 'Conflict', status: 409, detail: 'Stale stamp' };
    const error = new ConcurrencyConflictError('Resource changed', details);

    expect(error).toBeInstanceOf(HttpError);
    expect(error.name).toBe('ConcurrencyConflictError');
    expect(error.status).toBe(409);
    expect(error.problemDetails).toEqual(details);
  });
});

describe('isConcurrencyConflict', () => {
  it('matches a ConcurrencyConflictError', () => {
    expect(isConcurrencyConflict(new ConcurrencyConflictError('x'))).toBe(true);
  });

  it('matches an HttpError with status 409', () => {
    expect(isConcurrencyConflict(new HttpError('Conflict', 409))).toBe(true);
    expect(isConcurrencyConflict(new HttpError('Not Found', 404))).toBe(false);
  });

  it('matches a raw Axios-shaped error with response status 409', () => {
    expect(isConcurrencyConflict({ response: { status: 409 } })).toBe(true);
    expect(isConcurrencyConflict({ response: { status: 400 } })).toBe(false);
  });

  it('is false for unrelated values', () => {
    expect(isConcurrencyConflict(null)).toBe(false);
    expect(isConcurrencyConflict(new Error('boom'))).toBe(false);
    expect(isConcurrencyConflict('409')).toBe(false);
  });
});

describe('TimeoutError', () => {
  it('should set name, message, and timeoutMs', () => {
    const error = new TimeoutError('Request timed out', 5000);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('TimeoutError');
    expect(error.message).toBe('Request timed out');
    expect(error.timeoutMs).toBe(5000);
  });
});

describe('isBackendUnavailable', () => {
  it('is true for an Axios transport error with no response (network/DNS)', () => {
    expect(isBackendUnavailable({ isAxiosError: true, code: 'ERR_NETWORK' })).toBe(true);
  });

  it('is true for a client-side timeout (no response)', () => {
    expect(isBackendUnavailable({ isAxiosError: true, code: 'ECONNABORTED' })).toBe(true);
  });

  it('is false for an HTTP error that carries a response (even 5xx)', () => {
    expect(isBackendUnavailable({ isAxiosError: true, response: { status: 503 } })).toBe(false);
  });

  it('is false for non-Axios values', () => {
    expect(isBackendUnavailable(new Error('boom'))).toBe(false);
    expect(isBackendUnavailable(null)).toBe(false);
    expect(isBackendUnavailable('nope')).toBe(false);
  });
});

describe('getHttpStatus', () => {
  it('returns the status when an HTTP response exists', () => {
    expect(getHttpStatus({ response: { status: 500 } })).toBe(500);
  });

  it('returns undefined for a transport error with no response', () => {
    expect(getHttpStatus({ isAxiosError: true, code: 'ERR_NETWORK' })).toBeUndefined();
  });

  it('returns undefined for non-error values', () => {
    expect(getHttpStatus(null)).toBeUndefined();
    expect(getHttpStatus(42)).toBeUndefined();
  });
});
