import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useStorage } from '../use-storage';

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('useStorage', () => {
  it('should return defaultValue when key does not exist', () => {
    const { result } = renderHook(() => useStorage('theme', 'light'));
    expect(result.current[0]).toBe('light');
  });

  it('should return stored value when key exists', () => {
    localStorage.setItem('dd:theme', '"dark"');
    const { result } = renderHook(() => useStorage('theme', 'light'));
    expect(result.current[0]).toBe('dark');
  });

  it('should update the value and persist to localStorage', () => {
    const { result } = renderHook(() => useStorage('theme', 'light'));

    act(() => {
      result.current[1]('dark');
    });

    expect(result.current[0]).toBe('dark');
    expect(localStorage.getItem('dd:theme')).toBe('"dark"');
  });

  it('should trigger re-render with the new value', () => {
    const { result } = renderHook(() => useStorage<number>('count', 0));

    act(() => {
      result.current[1](42);
    });

    expect(result.current[0]).toBe(42);
  });

  it('should return defaultValue for corrupted JSON', () => {
    localStorage.setItem('dd:broken', '{bad-json');
    const { result } = renderHook(() => useStorage<Record<string, unknown>>('broken', {}));
    expect(result.current[0]).toEqual({});
  });

  it('should work with sessionStorage option', () => {
    const { result } = renderHook(() =>
      useStorage('session-key', 'default', { storage: 'session' })
    );

    act(() => {
      result.current[1]('session-value');
    });

    expect(result.current[0]).toBe('session-value');
    expect(sessionStorage.getItem('dd:session-key')).toBe('"session-value"');
    expect(localStorage.getItem('dd:session-key')).toBeNull();
  });

  it('should work with object values', () => {
    const { result } = renderHook(() => useStorage('sidebar', { open: false }));

    act(() => {
      result.current[1]({ open: true });
    });

    expect(result.current[0]).toEqual({ open: true });
  });

  it('should re-render on cross-tab storage event', () => {
    const { result } = renderHook(() => useStorage('theme', 'light'));

    act(() => {
      localStorage.setItem('dd:theme', '"dark"');
      globalThis.dispatchEvent(new StorageEvent('storage', { key: 'dd:theme' }));
    });

    expect(result.current[0]).toBe('dark');
  });

  it('should ignore storage events for other keys', () => {
    const { result } = renderHook(() => useStorage('theme', 'light'));

    act(() => {
      localStorage.setItem('dd:other', '"value"');
      globalThis.dispatchEvent(new StorageEvent('storage', { key: 'dd:other' }));
    });

    expect(result.current[0]).toBe('light');
  });

  it('should use custom serializer and deserializer', () => {
    const { result } = renderHook(() =>
      useStorage<Date>('date', new Date('2026-01-01T00:00:00Z'), {
        serialize: (d) => d.toISOString(),
        deserialize: (raw) => new Date(raw),
      })
    );

    const newDate = new Date('2026-06-15T12:00:00Z');
    act(() => {
      result.current[1](newDate);
    });

    expect(result.current[0]).toBeInstanceOf(Date);
    expect(result.current[0].toISOString()).toBe('2026-06-15T12:00:00.000Z');
  });
});
