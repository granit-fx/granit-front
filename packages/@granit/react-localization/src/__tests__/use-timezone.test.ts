import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import { TimezoneProvider, useTimezone } from '../use-timezone';

describe('useTimezone', () => {
  it('should fall back to the browser timezone when no provider is present', () => {
    const { result } = renderHook(() => useTimezone());
    const expected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(result.current).toBe(expected);
  });

  it('should return the timezone from the nearest TimezoneProvider', () => {
    function wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(TimezoneProvider, { value: 'America/New_York' }, children);
    }

    const { result } = renderHook(() => useTimezone(), { wrapper });
    expect(result.current).toBe('America/New_York');
  });

  it('should fall back to browser timezone when provider value is null', () => {
    function wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(TimezoneProvider, { value: null }, children);
    }

    const { result } = renderHook(() => useTimezone(), { wrapper });
    const expected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(result.current).toBe(expected);
  });
});
