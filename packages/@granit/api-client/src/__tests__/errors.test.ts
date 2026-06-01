import { describe, expect, it } from 'vitest';

import { HttpError, TimeoutError, ValidationError } from '../errors';

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

describe('TimeoutError', () => {
  it('should set name, message, and timeoutMs', () => {
    const error = new TimeoutError('Request timed out', 5000);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('TimeoutError');
    expect(error.message).toBe('Request timed out');
    expect(error.timeoutMs).toBe(5000);
  });
});
