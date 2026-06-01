import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useEChartsTheme } from '../hooks/use-echarts-theme';

import type { ChartThemeTokens } from '@granit/charts';

const LIGHT: ChartThemeTokens = {
  background: '#ffffff',
  foreground: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  palette: ['#0ea5e9', '#22c55e', '#f97316'],
};

const DARK: ChartThemeTokens = {
  background: '#0f172a',
  foreground: '#e2e8f0',
  muted: '#94a3b8',
  border: '#1e293b',
  palette: ['#38bdf8', '#4ade80', '#fb923c'],
};

afterEach(() => {
  document.documentElement.classList.remove('dark');
  vi.restoreAllMocks();
});

describe('useEChartsTheme — class strategy', () => {
  it('returns the light theme name when no `.dark` class is on <html>', () => {
    const { result } = renderHook(() => useEChartsTheme({ lightTokens: LIGHT, darkTokens: DARK }));

    expect(result.current).toBe('granit-light');
  });

  it('initialises to the dark theme name when `.dark` is already on <html>', () => {
    document.documentElement.classList.add('dark');
    const { result } = renderHook(() => useEChartsTheme({ lightTokens: LIGHT, darkTokens: DARK }));

    expect(result.current).toBe('granit-dark');
  });

  it('reacts to <html> class mutations via the MutationObserver', async () => {
    const { result } = renderHook(() => useEChartsTheme({ lightTokens: LIGHT, darkTokens: DARK }));

    expect(result.current).toBe('granit-light');

    act(() => {
      document.documentElement.classList.add('dark');
    });

    // The observer notifies microtask-style; flush.
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBe('granit-dark');
  });

  it('falls back to the light theme name when no dark tokens are provided', () => {
    document.documentElement.classList.add('dark');
    const { result } = renderHook(() => useEChartsTheme({ lightTokens: LIGHT }));

    // Even with `.dark` on <html>, without darkTokens the hook must return the
    // light name — there is no dark theme registered.
    expect(result.current).toBe('granit-light');
  });

  it('honours custom theme names', () => {
    document.documentElement.classList.add('dark');
    const { result } = renderHook(() =>
      useEChartsTheme({
        lightTokens: LIGHT,
        darkTokens: DARK,
        themeNames: ['app-light', 'app-dark'] as const,
      })
    );

    expect(result.current).toBe('app-dark');
  });
});

describe('useEChartsTheme — media strategy', () => {
  function stubMatchMedia(matches: boolean) {
    const listeners = new Set<(event: { matches: boolean }) => void>();
    const mq = {
      matches,
      media: '(prefers-color-scheme: dark)',
      addEventListener: (_type: string, cb: (event: { matches: boolean }) => void) => {
        listeners.add(cb);
      },
      removeEventListener: (_type: string, cb: (event: { matches: boolean }) => void) => {
        listeners.delete(cb);
      },
      dispatch(next: boolean) {
        mq.matches = next;
        for (const cb of listeners) cb({ matches: next });
      },
    };
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mq)
    );
    return mq;
  }

  it('initialises from prefers-color-scheme and reacts to the media-query event', async () => {
    const mq = stubMatchMedia(false);
    const { result } = renderHook(() =>
      useEChartsTheme({
        lightTokens: LIGHT,
        darkTokens: DARK,
        darkModeStrategy: 'media',
      })
    );

    expect(result.current).toBe('granit-light');

    await act(async () => {
      mq.dispatch(true);
    });

    expect(result.current).toBe('granit-dark');
  });

  it('initialises to dark when prefers-color-scheme already matches', () => {
    stubMatchMedia(true);
    const { result } = renderHook(() =>
      useEChartsTheme({
        lightTokens: LIGHT,
        darkTokens: DARK,
        darkModeStrategy: 'media',
      })
    );

    expect(result.current).toBe('granit-dark');
  });
});
