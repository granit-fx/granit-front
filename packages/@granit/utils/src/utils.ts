import { TZDate } from '@date-fns/tz';
import { type ClassValue, clsx } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import { twMerge } from 'tailwind-merge';

import type { Locale } from 'date-fns';

/**
 * Merge Tailwind CSS classes with clsx and tailwind-merge.
 * Resolves conflicts between Tailwind utility classes.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with locale-aware thousand separators.
 */
export function formatNumber(
  value: number,
  opts?: Intl.NumberFormatOptions,
  locale?: string
): string {
  return new Intl.NumberFormat(locale, opts).format(value);
}

/** Resolve a date input into the target timezone when provided. */
function toDate(date: string | Date, timezone?: string): Date {
  if (!timezone) return typeof date === 'string' ? new Date(date) : date;
  if (typeof date === 'string') return new TZDate(date, timezone);
  return new TZDate(date, timezone);
}

/**
 * Format a date to a long readable string (e.g., "February 27, 2026").
 * When `timezone` is provided the date is converted to that IANA timezone first.
 * When `locale` is provided the output uses that date-fns locale.
 */
export function formatDate(date: string | Date, timezone?: string, locale?: Locale): string {
  return format(toDate(date, timezone), 'PPP', { locale });
}

/**
 * Format a date to date + time (e.g., "February 27, 2026 14:30:00").
 * When `timezone` is provided the date is converted to that IANA timezone first.
 * When `locale` is provided the output uses that date-fns locale.
 */
export function formatDateTime(date: string | Date, timezone?: string, locale?: Locale): string {
  return format(toDate(date, timezone), 'PPP HH:mm:ss', { locale });
}

/**
 * Format a date as relative time (e.g., "2 hours ago").
 * When `timezone` is provided the date is converted to that IANA timezone first.
 * When `locale` is provided the output uses that date-fns locale.
 */
export function formatTimeAgo(date: string | Date, timezone?: string, locale?: Locale): string {
  return formatDistanceToNow(toDate(date, timezone), { addSuffix: true, locale });
}

/**
 * Calculate the percentage of value over total.
 * Returns 0 when total is 0 to avoid division by zero.
 * @param decimals - Number of decimal places to keep (default: 0, integer result).
 */
export function calculatePercentage(value: number, total: number, decimals = 0): number {
  if (total === 0) return 0;
  const factor = 10 ** decimals;
  return Math.round((value / total) * 100 * factor) / factor;
}
