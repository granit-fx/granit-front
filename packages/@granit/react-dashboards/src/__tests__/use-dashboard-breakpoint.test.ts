import { describe, expect, it } from 'vitest';

import {
  DASHBOARD_BREAKPOINT_MIN_WIDTH,
  resolveBreakpoint,
} from '../hooks/use-dashboard-breakpoint.js';

describe('DASHBOARD_BREAKPOINT_MIN_WIDTH', () => {
  it('matches the conventional Tailwind / Bootstrap thresholds', () => {
    expect(DASHBOARD_BREAKPOINT_MIN_WIDTH).toEqual({
      Xs: 0,
      Sm: 640,
      Md: 768,
      Lg: 1024,
      Xl: 1280,
    });
  });
});

describe('resolveBreakpoint', () => {
  it('returns Xs for any width below the Sm threshold', () => {
    expect(resolveBreakpoint(0)).toBe('Xs');
    expect(resolveBreakpoint(320)).toBe('Xs');
    expect(resolveBreakpoint(639)).toBe('Xs');
  });

  it('matches each threshold exactly', () => {
    expect(resolveBreakpoint(640)).toBe('Sm');
    expect(resolveBreakpoint(768)).toBe('Md');
    expect(resolveBreakpoint(1024)).toBe('Lg');
    expect(resolveBreakpoint(1280)).toBe('Xl');
  });

  it('returns the strongest matching breakpoint for in-between widths', () => {
    expect(resolveBreakpoint(700)).toBe('Sm');
    expect(resolveBreakpoint(900)).toBe('Md');
    expect(resolveBreakpoint(1200)).toBe('Lg');
    expect(resolveBreakpoint(1920)).toBe('Xl');
  });
});
