import { TZDate } from '@date-fns/tz';
import { format, formatDistanceToNow } from 'date-fns';
import { useCallback } from 'react';

import { useDateLocale } from './date-locale';
import { useLocale } from './use-locale';
import { useTimezone } from './use-timezone';

/** Convert a date input to a TZDate in the given timezone. */
function toZoned(date: string | Date, timezone: string): TZDate {
  if (typeof date === 'string') return new TZDate(date, timezone);
  return new TZDate(date, timezone);
}

/**
 * Hook that returns locale- and timezone-aware date formatting functions.
 *
 * - **Locale** is resolved from the current UI language ({@link useLocale}).
 * - **Timezone** is resolved from the nearest {@link TimezoneProvider},
 *   falling back to the browser timezone.
 *
 * All dates are converted to the user's timezone before formatting.
 */
export function useDateFormatter() {
  const { locale } = useLocale();
  const dateLocale = useDateLocale(locale);
  const timezone = useTimezone();

  const formatDate = useCallback(
    (date: string | Date) => format(toZoned(date, timezone), 'PPP', { locale: dateLocale }),
    [dateLocale, timezone]
  );

  const formatDateTime = useCallback(
    (date: string | Date) =>
      format(toZoned(date, timezone), 'PPP HH:mm:ss', { locale: dateLocale }),
    [dateLocale, timezone]
  );

  const formatTimeAgo = useCallback(
    (date: string | Date) =>
      formatDistanceToNow(toZoned(date, timezone), { addSuffix: true, locale: dateLocale }),
    [dateLocale, timezone]
  );

  return { formatDate, formatDateTime, formatTimeAgo };
}
