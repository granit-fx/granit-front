import { validateFieldsBatch } from '@granit/validation';
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { useServerValidationBatch } from '../use-server-validation-batch';

import type { BatchFieldSpec } from '../use-server-validation-batch';
import type { FieldConstraint } from '@granit/validation';

vi.mock('@granit/validation', async () => {
  const actual = await vi.importActual('@granit/validation');
  return { ...actual, validateFieldsBatch: vi.fn() };
});

const mockValidateFieldsBatch = vi.mocked(validateFieldsBatch);

function createMockClient() {
  return { get: vi.fn(), post: vi.fn() } as never;
}

const t = vi.fn((key: string) => `translated:${key}`);

const ibanConstraint: FieldConstraint = { granitValidator: 'Validation:Format:Iban' };
const bceConstraint: FieldConstraint = { granitValidator: 'Validation:InvalidBce' };
const plainConstraint: FieldConstraint = { required: true, maxLength: 100 };

describe('useServerValidationBatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockValidateFieldsBatch.mockReset();
    t.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty state when no fields have granitValidator', () => {
    const fields: BatchFieldSpec[] = [{ name: 'name', constraint: plainConstraint, value: 'John' }];

    const { result } = renderHook(() =>
      useServerValidationBatch({ client: createMockClient(), fields, t })
    );

    expect(result.current).toEqual({});
    expect(mockValidateFieldsBatch).not.toHaveBeenCalled();
  });

  it('returns empty state when all server-validated fields are empty', () => {
    const fields: BatchFieldSpec[] = [{ name: 'iban', constraint: ibanConstraint, value: '' }];

    const { result } = renderHook(() =>
      useServerValidationBatch({ client: createMockClient(), fields, t })
    );

    expect(result.current).toEqual({});
  });

  it('returns empty state when enabled is false', () => {
    const fields: BatchFieldSpec[] = [
      { name: 'iban', constraint: ibanConstraint, value: 'BE68539007547034' },
    ];

    const { result } = renderHook(() =>
      useServerValidationBatch({ client: createMockClient(), fields, t, enabled: false })
    );

    expect(result.current).toEqual({});
  });

  it('transitions all eligible fields to validating after debounce', async () => {
    const fields: BatchFieldSpec[] = [
      { name: 'iban', constraint: ibanConstraint, value: 'BE68539007547034' },
      { name: 'bce', constraint: bceConstraint, value: '0123456789' },
    ];
    mockValidateFieldsBatch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() =>
      useServerValidationBatch({ client: createMockClient(), fields, t, debounceMs: 200 })
    );

    expect(result.current).toEqual({});

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current['iban']?.status).toBe('validating');
    expect(result.current['bce']?.status).toBe('validating');
  });

  it('maps Valid results correctly', async () => {
    const fields: BatchFieldSpec[] = [
      { name: 'iban', constraint: ibanConstraint, value: 'BE68539007547034' },
    ];
    mockValidateFieldsBatch.mockResolvedValue([
      { errorCode: 'Validation:Format:Iban', status: 'Valid' },
    ]);

    const { result } = renderHook(() =>
      useServerValidationBatch({ client: createMockClient(), fields, t, debounceMs: 100 })
    );

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current['iban']?.status).toBe('valid');
  });

  it('maps Invalid results with translated message', async () => {
    const fields: BatchFieldSpec[] = [
      { name: 'iban', constraint: ibanConstraint, value: 'INVALID' },
    ];
    mockValidateFieldsBatch.mockResolvedValue([
      { errorCode: 'Validation:Format:Iban', status: 'Invalid' },
    ]);

    const { result } = renderHook(() =>
      useServerValidationBatch({ client: createMockClient(), fields, t, debounceMs: 100 })
    );

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current['iban']?.status).toBe('invalid');
    expect(result.current['iban']?.message).toBe('translated:Validation:Format:Iban');
  });

  it('maps ValidatorNotFound to idle', async () => {
    const fields: BatchFieldSpec[] = [
      { name: 'iban', constraint: ibanConstraint, value: 'something' },
    ];
    mockValidateFieldsBatch.mockResolvedValue([
      { errorCode: 'Validation:Format:Iban', status: 'ValidatorNotFound' },
    ]);

    const { result } = renderHook(() =>
      useServerValidationBatch({ client: createMockClient(), fields, t, debounceMs: 100 })
    );

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current['iban']?.status).toBe('idle');
  });

  it('sets all fields to error on network failure', async () => {
    const fields: BatchFieldSpec[] = [
      { name: 'iban', constraint: ibanConstraint, value: 'BE68539007547034' },
      { name: 'bce', constraint: bceConstraint, value: '0123456789' },
    ];
    mockValidateFieldsBatch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useServerValidationBatch({ client: createMockClient(), fields, t, debounceMs: 100 })
    );

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current['iban']?.status).toBe('error');
    expect(result.current['bce']?.status).toBe('error');
  });

  it('excludes fields that fail client-side validation', async () => {
    const strictConstraint: FieldConstraint = {
      maxLength: 5,
      granitValidator: 'Validation:Format:Iban',
    };
    const fields: BatchFieldSpec[] = [
      { name: 'iban', constraint: strictConstraint, value: 'WAY_TOO_LONG_VALUE' },
    ];

    const { result } = renderHook(() =>
      useServerValidationBatch({ client: createMockClient(), fields, t, debounceMs: 100 })
    );

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toEqual({});
    expect(mockValidateFieldsBatch).not.toHaveBeenCalled();
  });
});
