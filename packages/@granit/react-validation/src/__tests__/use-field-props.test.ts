import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useFieldProps } from '../use-field-props';

import type { SchemaConstraints } from '@granit/validation';

describe('useFieldProps', () => {
  const t = vi.fn((key: string) => `translated:${key}`);

  const constraints: SchemaConstraints = {
    name: { required: true, maxLength: 100 },
    iban: {
      required: true,
      granitValidator: 'Validation:InvalidIban',
    },
  };

  it('returns empty inputProps for unknown field', () => {
    const { result } = renderHook(() => useFieldProps(constraints, 'unknown', t));
    expect(result.current).toEqual({ inputProps: {} });
  });

  it('returns correct inputProps from getInputProps', () => {
    const { result } = renderHook(() => useFieldProps(constraints, 'name', t));
    expect(result.current.inputProps).toEqual({ maxLength: 100 });
  });

  it('returns serverHint when granitValidator is present', () => {
    const { result } = renderHook(() => useFieldProps(constraints, 'iban', t));
    expect(result.current.serverHint).toBe('translated:Validation:InvalidIban');
  });

  it('omits serverHint when no granitValidator', () => {
    const { result } = renderHook(() => useFieldProps(constraints, 'name', t));
    expect(result.current.serverHint).toBeUndefined();
  });

  it('memoizes result when inputs are stable (reference equality check)', () => {
    const { result, rerender } = renderHook(() => useFieldProps(constraints, 'name', t));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('recomputes when fieldName changes', () => {
    const { result, rerender } = renderHook(({ field }) => useFieldProps(constraints, field, t), {
      initialProps: { field: 'name' },
    });
    const first = result.current;
    rerender({ field: 'iban' });
    expect(result.current).not.toBe(first);
    expect(result.current.serverHint).toBeDefined();
  });
});
