import { act, renderHook } from '@testing-library/react';
import { enUS, fr } from 'date-fns/locale';
import { describe, expect, it } from 'vitest';

import { useDateLocale } from '../date-locale';

describe('useDateLocale', () => {
  it('should return en-US immediately for "en" (pre-cached)', () => {
    const { result } = renderHook(() => useDateLocale('en'));
    expect(result.current).toBe(enUS);
  });

  it('should return en-US immediately for "en-US" (pre-cached)', () => {
    const { result } = renderHook(() => useDateLocale('en-US'));
    expect(result.current).toBe(enUS);
  });

  it('should dynamically load "fr" and resolve to the french locale', async () => {
    const { result } = renderHook(() => useDateLocale('fr'));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.code).toBe(fr.code);
  });

  it('should dynamically load a compound locale like "pt-BR"', async () => {
    const { result } = renderHook(() => useDateLocale('pt-BR'));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.code).toBe('pt-BR');
  });

  it('should resolve alias "zh" to "zh-CN"', async () => {
    const { result } = renderHook(() => useDateLocale('zh'));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.code).toBe('zh-CN');
  });

  it('should fall back to en-US for an unknown locale', async () => {
    const { result } = renderHook(() => useDateLocale('xx-UNKNOWN'));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current).toBe(enUS);
  });

  it('should update when the locale prop changes', async () => {
    const { result, rerender } = renderHook(({ locale }) => useDateLocale(locale), {
      initialProps: { locale: 'en' },
    });

    expect(result.current).toBe(enUS);

    rerender({ locale: 'de' });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.code).toBe('de');
  });
});
