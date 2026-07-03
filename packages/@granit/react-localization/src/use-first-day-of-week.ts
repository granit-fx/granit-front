import { createContext, useContext } from 'react';

import type { Weekday } from '@granit/timing';

const DAY_NAME_TO_WEEKDAY: Readonly<Record<string, Weekday>> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Browser-locale first day of week, resolved once. `Intl.Locale.getWeekInfo()`
 * reports `firstDay` as `1` = Monday … `7` = Sunday (ISO); `% 7` maps it to the
 * `0` = Sunday convention. Falls back to Monday where the API is unavailable
 * (older engines, JSDOM) — the same neutral default the framework assumes.
 */
const BROWSER_FIRST_DAY: Weekday = resolveBrowserFirstDay();

function resolveBrowserFirstDay(): Weekday {
  try {
    const locale = new Intl.Locale(Intl.DateTimeFormat().resolvedOptions().locale);
    const weekInfo =
      (locale as { getWeekInfo?: () => { firstDay?: number } }).getWeekInfo?.() ??
      (locale as { weekInfo?: { firstDay?: number } }).weekInfo;
    const firstDay = weekInfo?.firstDay;
    if (typeof firstDay === 'number') return (firstDay % 7) as Weekday;
  } catch {
    // `Intl.Locale` week info is not universally supported — use the default.
    return 1;
  }
  return 1;
}

const FirstDayOfWeekContext = createContext<string | null>(null);

/**
 * Provider that sets the first day of week for calendar-token resolution
 * (`wtd` / `pw`) in the subtree.
 *
 * The consuming app feeds the value — typically from the backend setting
 * `Granit.Timing.PreferredFirstDayOfWeek` via `useSetting`, mirroring
 * {@link TimezoneProvider}. The value is a `System.DayOfWeek` name (`"Monday"`,
 * `"Sunday"`, …) or `null` to defer to the browser locale.
 *
 * @example
 * ```tsx
 * const { data } = useSetting('user', SETTING_NAMES.FIRST_DAY_OF_WEEK);
 *
 * <FirstDayOfWeekProvider value={data?.value ?? null}>
 *   <App />
 * </FirstDayOfWeekProvider>
 * ```
 */
export const FirstDayOfWeekProvider = FirstDayOfWeekContext.Provider;

/**
 * Returns the effective first day of week as a {@link Weekday}.
 *
 * Resolution order:
 * 1. Value from the nearest {@link FirstDayOfWeekProvider} (backend setting).
 * 2. Browser locale via `Intl.Locale` week info.
 * 3. Monday.
 *
 * This must match `Granit.Timing` `PeriodResolver` server-side so `wtd` / `pw`
 * resolve to the same window on the definition and bundle paths.
 */
export function useFirstDayOfWeek(): Weekday {
  const value = useContext(FirstDayOfWeekContext);
  if (value) {
    const parsed = DAY_NAME_TO_WEEKDAY[value.toLowerCase()];
    if (parsed !== undefined) return parsed;
  }
  return BROWSER_FIRST_DAY;
}
