import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FirstDayOfWeekProvider, useFirstDayOfWeek } from '../use-first-day-of-week';

import type { ReactNode } from 'react';

function withProvider(value: string | null) {
  return ({ children }: { readonly children: ReactNode }) => (
    <FirstDayOfWeekProvider value={value}>{children}</FirstDayOfWeekProvider>
  );
}

describe('useFirstDayOfWeek', () => {
  it('parses a DayOfWeek name from the provider', () => {
    expect(renderHook(() => useFirstDayOfWeek(), { wrapper: withProvider('Sunday') }).result.current).toBe(0);
    expect(renderHook(() => useFirstDayOfWeek(), { wrapper: withProvider('Monday') }).result.current).toBe(1);
    expect(renderHook(() => useFirstDayOfWeek(), { wrapper: withProvider('Saturday') }).result.current).toBe(6);
  });

  it('is case-insensitive', () => {
    expect(renderHook(() => useFirstDayOfWeek(), { wrapper: withProvider('monday') }).result.current).toBe(1);
  });

  it('falls back to a valid browser-derived weekday outside a provider', () => {
    // Locale-dependent (Intl week info), so only assert it is a valid Weekday.
    const day = renderHook(() => useFirstDayOfWeek()).result.current;
    expect(day).toBeGreaterThanOrEqual(0);
    expect(day).toBeLessThanOrEqual(6);
  });

  it('falls back to the same browser default for an unrecognised value', () => {
    const fallback = renderHook(() => useFirstDayOfWeek()).result.current;
    expect(
      renderHook(() => useFirstDayOfWeek(), { wrapper: withProvider('Someday') }).result.current
    ).toBe(fallback);
  });
});
