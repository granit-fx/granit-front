import { toTimeZoneId } from '@granit/timing';
import { createContext, useContext } from 'react';

import type { TimeZoneId } from '@granit/timing';

const BROWSER_TIMEZONE = toTimeZoneId(Intl.DateTimeFormat().resolvedOptions().timeZone);

const TimezoneContext = createContext<string | null>(null);

/**
 * Provider that sets the user's preferred timezone for all date formatting
 * hooks in the subtree.
 *
 * The consuming app is responsible for feeding the timezone value
 * (typically from the user settings API via `useSetting`).
 *
 * @example
 * ```tsx
 * const { data } = useSetting('user', SETTING_NAMES.PREFERRED_TIMEZONE);
 *
 * <TimezoneProvider value={data?.value ?? null}>
 *   <App />
 * </TimezoneProvider>
 * ```
 */
export const TimezoneProvider = TimezoneContext.Provider;

/**
 * Returns the user's preferred timezone as a branded {@link TimeZoneId}
 * (IANA identifier).
 *
 * Resolution order:
 * 1. Value from the nearest {@link TimezoneProvider} (user setting)
 * 2. Browser timezone via `Intl.DateTimeFormat`
 */
export function useTimezone(): TimeZoneId {
  const value = useContext(TimezoneContext);
  return value ? toTimeZoneId(value) : BROWSER_TIMEZONE;
}
