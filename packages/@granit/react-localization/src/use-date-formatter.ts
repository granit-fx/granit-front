import {
  formatDate as formatDateUtil,
  formatDateTime as formatDateTimeUtil,
  formatTimeAgo as formatTimeAgoUtil,
} from '@granit/utils';
import { useCallback } from 'react';

import { useDateLocale } from './date-locale';
import { useLocale } from './use-locale';
import { useTimezone } from './use-timezone';

/**
 * Hook that returns locale- and timezone-aware date formatting functions.
 *
 * - **Locale** is resolved from the current UI language ({@link useLocale}).
 * - **Timezone** is resolved from the nearest {@link TimezoneProvider},
 *   falling back to the browser timezone.
 *
 * Delegates to `@granit/utils` formatDate/formatDateTime/formatTimeAgo,
 * passing the resolved locale and timezone so the framework has a single
 * source of truth for date formatting logic.
 */
export function useDateFormatter() {
  const { locale } = useLocale();
  const dateLocale = useDateLocale(locale);
  const timezone = useTimezone();

  const formatDate = useCallback(
    (date: string | Date) => formatDateUtil(date, timezone, dateLocale),
    [dateLocale, timezone]
  );

  const formatDateTime = useCallback(
    (date: string | Date) => formatDateTimeUtil(date, timezone, dateLocale),
    [dateLocale, timezone]
  );

  const formatTimeAgo = useCallback(
    (date: string | Date) => formatTimeAgoUtil(date, timezone, dateLocale),
    [dateLocale, timezone]
  );

  return { formatDate, formatDateTime, formatTimeAgo };
}
