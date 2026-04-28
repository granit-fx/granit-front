import { describe, expect, it } from 'vitest';

import { buildEChartsTheme } from '../theme/build-echarts-theme.js';

interface ExpectedShape {
  readonly color: readonly string[];
  readonly textStyle: { readonly color: string; readonly fontFamily: string };
}

const TOKENS = {
  background: '#ffffff',
  foreground: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  palette: ['#3b82f6', '#10b981', '#f59e0b'] as const,
};

describe('buildEChartsTheme', () => {
  it('returns the categorical palette as the top-level color array', () => {
    const theme = buildEChartsTheme(TOKENS) as unknown as ExpectedShape;
    expect(theme.color).toEqual([...TOKENS.palette]);
  });

  it('threads the foreground token into textStyle.color', () => {
    const theme = buildEChartsTheme(TOKENS) as unknown as ExpectedShape;
    expect(theme.textStyle.color).toBe(TOKENS.foreground);
  });

  it('returns a frozen object so consumers can not mutate shared state', () => {
    const theme = buildEChartsTheme(TOKENS);
    expect(Object.isFrozen(theme)).toBe(true);
  });

  it('falls back to inherited font family when none is provided', () => {
    const theme = buildEChartsTheme(TOKENS) as unknown as ExpectedShape;
    expect(theme.textStyle.fontFamily).toBe('inherit');
  });

  it('respects an explicit fontFamily token', () => {
    const theme = buildEChartsTheme({
      ...TOKENS,
      fontFamily: 'Inter, sans-serif',
    }) as unknown as ExpectedShape;
    expect(theme.textStyle.fontFamily).toBe('Inter, sans-serif');
  });
});
