/** Well-known setting names registered by the Granit backend. */
export const SETTING_NAMES = {
  PREFERRED_CULTURE: 'Granit.Localization.PreferredCulture',
  PREFERRED_TIMEZONE: 'Granit.Timing.PreferredTimezone',
  /** `System.DayOfWeek` name overriding the culture-derived first day of week (`wtd` / `pw`). */
  FIRST_DAY_OF_WEEK: 'Granit.Timing.PreferredFirstDayOfWeek',
} as const;
