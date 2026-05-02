import { useEffect, useState } from 'react';

import type { DashboardBreakpoint } from '@granit/dashboards';

/**
 * Tailwind / Bootstrap-style breakpoint thresholds (min-width in px). Mirrors
 * the same values the framework's UI library uses, so a `Sm`-flagged
 * dashboard layout matches the same viewport range as a `sm:` Tailwind
 * utility.
 *
 * Exported so apps that need programmatic access to the thresholds (e.g.
 * Storybook viewport addon) stay in sync without re-declaring constants.
 */
export const DASHBOARD_BREAKPOINT_MIN_WIDTH: Readonly<Record<DashboardBreakpoint, number>> =
  Object.freeze({
    Xs: 0,
    Sm: 640,
    Md: 768,
    Lg: 1024,
    Xl: 1280,
  });

const ORDERED: readonly DashboardBreakpoint[] = ['Xl', 'Lg', 'Md', 'Sm', 'Xs'];

/**
 * Picks the strongest {@link DashboardBreakpoint} matching a viewport
 * width. `'Xs'` is the floor (matches every width).
 *
 * Exported so tests can drive the resolution without rendering, and apps
 * implementing custom breakpoint detection (SSR-aware, container-query
 * based) reuse the same mapping.
 */
export function resolveBreakpoint(viewportWidth: number): DashboardBreakpoint {
  for (const bp of ORDERED) {
    if (viewportWidth >= DASHBOARD_BREAKPOINT_MIN_WIDTH[bp]) return bp;
  }
  return 'Xs';
}

/**
 * SSR-safe accessor for the current window width. Returns `null` during
 * server rendering so the hook can fall back to `'Xs'` (mobile-first
 * default) until the client hydrates.
 */
function readViewportWidth(): number | null {
  if (globalThis.window === undefined) return null;
  return globalThis.innerWidth;
}

/**
 * Hook returning the active {@link DashboardBreakpoint}. Used by
 * `<Dashboard>` / `<EditableDashboard>` to merge
 * `DashboardLayout.breakpoints[active]` over the base layout.
 *
 * SSR-safe: emits `'Xs'` until the client mounts; the `resize` listener
 * registers in `useEffect` so server bundles never touch `window`.
 *
 * @example
 *   const breakpoint = useDashboardBreakpoint();
 *   const override = definition.layout.breakpoints?.[breakpoint];
 */
export function useDashboardBreakpoint(): DashboardBreakpoint {
  const [breakpoint, setBreakpoint] = useState<DashboardBreakpoint>(() => {
    const width = readViewportWidth();
    return width === null ? 'Xs' : resolveBreakpoint(width);
  });

  useEffect(() => {
    if (globalThis.window === undefined) return undefined;
    const handleResize = () => setBreakpoint(resolveBreakpoint(globalThis.innerWidth));
    globalThis.addEventListener('resize', handleResize);
    // Run once after mount to flip from the SSR-safe `'Xs'` to the actual
    // viewport without waiting for the first resize.
    handleResize();
    return () => globalThis.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}
