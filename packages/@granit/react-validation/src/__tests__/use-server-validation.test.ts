import { validateFieldServer } from '@granit/validation';
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { useServerValidation } from '../use-server-validation';

import type { FieldConstraint } from '@granit/validation';

// Mock the server API call
vi.mock('@granit/validation', async () => {
  const actual = await vi.importActual('@granit/validation');
  return { ...actual, validateFieldServer: vi.fn() };
});

const mockValidateFieldServer = vi.mocked(validateFieldServer);

function createMockClient() {
  return { get: vi.fn(), post: vi.fn() } as never;
}

const t = vi.fn((key: string) => `translated:${key}`);

describe('useServerValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockValidateFieldServer.mockReset();
    t.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns idle when constraint has no granitValidator', () => {
    const constraint: FieldConstraint = { required: true };
    const { result } = renderHook(() =>
      useServerValidation({
        client: createMockClient(),
        constraint,
        value: 'test',
        t,
      })
    );
    expect(result.current.status).toBe('idle');
  });

  it('returns idle when value is empty and field is not required', () => {
    const constraint: FieldConstraint = {
      granitValidator: 'Validation:InvalidIban',
    };
    const { result } = renderHook(() =>
      useServerValidation({
        client: createMockClient(),
        constraint,
        value: '',
        t,
      })
    );
    expect(result.current.status).toBe('idle');
  });

  it('returns idle when value is empty and field is required (let resolver handle)', () => {
    const constraint: FieldConstraint = {
      required: true,
      granitValidator: 'Validation:InvalidIban',
    };
    const { result } = renderHook(() =>
      useServerValidation({
        client: createMockClient(),
        constraint,
        value: '',
        t,
      })
    );
    expect(result.current.status).toBe('idle');
  });

  it('returns idle when client-side validation fails', () => {
    const constraint: FieldConstraint = {
      required: true,
      maxLength: 5,
      granitValidator: 'Validation:InvalidIban',
    };
    const { result } = renderHook(() =>
      useServerValidation({
        client: createMockClient(),
        constraint,
        value: 'way too long value here',
        t,
      })
    );
    expect(result.current.status).toBe('idle');
  });

  it('returns idle when enabled is false', () => {
    const constraint: FieldConstraint = {
      granitValidator: 'Validation:InvalidIban',
    };
    const { result } = renderHook(() =>
      useServerValidation({
        client: createMockClient(),
        constraint,
        value: 'BE68539007547034',
        t,
        enabled: false,
      })
    );
    expect(result.current.status).toBe('idle');
  });

  it('transitions to validating after debounce', async () => {
    const constraint: FieldConstraint = {
      granitValidator: 'Validation:InvalidIban',
    };
    mockValidateFieldServer.mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHook(() =>
      useServerValidation({
        client: createMockClient(),
        constraint,
        value: 'BE68539007547034',
        t,
        debounceMs: 300,
      })
    );

    expect(result.current.status).toBe('idle');

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.status).toBe('validating');
  });

  it('transitions to valid when server returns Valid', async () => {
    const constraint: FieldConstraint = {
      granitValidator: 'Validation:InvalidIban',
    };
    mockValidateFieldServer.mockResolvedValue('Valid');

    const { result } = renderHook(() =>
      useServerValidation({
        client: createMockClient(),
        constraint,
        value: 'BE68539007547034',
        t,
        debounceMs: 100,
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.status).toBe('valid');
  });

  it('transitions to invalid with translated message when server returns Invalid', async () => {
    const constraint: FieldConstraint = {
      granitValidator: 'Validation:InvalidIban',
    };
    mockValidateFieldServer.mockResolvedValue('Invalid');

    const { result } = renderHook(() =>
      useServerValidation({
        client: createMockClient(),
        constraint,
        value: 'INVALID_IBAN',
        t,
        debounceMs: 100,
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.status).toBe('invalid');
    expect(result.current.message).toBe('translated:Validation:InvalidIban');
  });

  it('transitions to idle when server returns ValidatorNotFound', async () => {
    const constraint: FieldConstraint = {
      granitValidator: 'Validation:Unknown',
    };
    mockValidateFieldServer.mockResolvedValue('ValidatorNotFound');

    const { result } = renderHook(() =>
      useServerValidation({
        client: createMockClient(),
        constraint,
        value: 'some-value',
        t,
        debounceMs: 100,
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.status).toBe('idle');
  });

  it('transitions to error on network failure', async () => {
    const constraint: FieldConstraint = {
      granitValidator: 'Validation:InvalidIban',
    };
    mockValidateFieldServer.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useServerValidation({
        client: createMockClient(),
        constraint,
        value: 'BE68539007547034',
        t,
        debounceMs: 100,
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.message).toBe('Network error');
  });

  it('debounces — does not call server before debounce time', () => {
    const constraint: FieldConstraint = {
      granitValidator: 'Validation:InvalidIban',
    };

    renderHook(() =>
      useServerValidation({
        client: createMockClient(),
        constraint,
        value: 'BE68539007547034',
        t,
        debounceMs: 500,
      })
    );

    vi.advanceTimersByTime(499);
    expect(mockValidateFieldServer).not.toHaveBeenCalled();
  });

  it('resets to idle and restarts debounce when value changes', async () => {
    const constraint: FieldConstraint = {
      granitValidator: 'Validation:InvalidIban',
    };
    mockValidateFieldServer.mockResolvedValue('Valid');

    const { result, rerender } = renderHook(
      ({ value }) =>
        useServerValidation({
          client: createMockClient(),
          constraint,
          value,
          t,
          debounceMs: 300,
        }),
      { initialProps: { value: 'BE68' } }
    );

    // Advance partially
    vi.advanceTimersByTime(200);
    expect(mockValidateFieldServer).not.toHaveBeenCalled();

    // Value changes — restarts debounce
    rerender({ value: 'BE6853' });
    vi.advanceTimersByTime(200);
    expect(mockValidateFieldServer).not.toHaveBeenCalled();

    // Full debounce from last change
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(mockValidateFieldServer).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('valid');
  });
});
