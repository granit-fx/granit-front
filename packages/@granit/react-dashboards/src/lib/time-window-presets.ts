import { DASHBOARD_TIME_WINDOW } from '@granit/dashboards';

import type { DashboardTimeWindow } from '@granit/dashboards';

/**
 * One quick-range option: the token identifying it in
 * {@link DashboardTimeWindow.period}, the window itself, and a localization key
 * (with an English fallback — packages ship no locale files, host translations
 * override via the key). Shared by the headless {@link DashboardTimeWindowToolbar}
 * and the UI-tier styled control so the vocabulary lives in one place.
 */
export interface TimeWindowPreset {
  readonly token: string;
  readonly window: DashboardTimeWindow;
  readonly labelKey: string;
  readonly defaultLabel: string;
}

export interface TimeWindowGroup {
  readonly labelKey: string;
  readonly defaultLabel: string;
  readonly presets: readonly TimeWindowPreset[];
}

const W = DASHBOARD_TIME_WINDOW;

function preset(
  window: DashboardTimeWindow,
  labelKey: string,
  defaultLabel: string
): TimeWindowPreset {
  const token = 'token' in window.period ? window.period.token : '';
  return { token, window, labelKey, defaultLabel };
}

/** Grafana-style quick ranges, grouped for a scannable menu. */
export const TIME_WINDOW_GROUPS: readonly TimeWindowGroup[] = [
  {
    labelKey: 'Dashboard:TimeWindow.Group.MinutesHours',
    defaultLabel: 'Minutes & hours',
    presets: [
      preset(W.Last5Minutes, 'Dashboard:TimeWindow.Last5Minutes', 'Last 5 minutes'),
      preset(W.Last15Minutes, 'Dashboard:TimeWindow.Last15Minutes', 'Last 15 minutes'),
      preset(W.Last30Minutes, 'Dashboard:TimeWindow.Last30Minutes', 'Last 30 minutes'),
      preset(W.Last1Hour, 'Dashboard:TimeWindow.Last1Hour', 'Last 1 hour'),
      preset(W.Last3Hours, 'Dashboard:TimeWindow.Last3Hours', 'Last 3 hours'),
      preset(W.Last6Hours, 'Dashboard:TimeWindow.Last6Hours', 'Last 6 hours'),
      preset(W.Last12Hours, 'Dashboard:TimeWindow.Last12Hours', 'Last 12 hours'),
      preset(W.Last24Hours, 'Dashboard:TimeWindow.Last24Hours', 'Last 24 hours'),
    ],
  },
  {
    labelKey: 'Dashboard:TimeWindow.Group.Days',
    defaultLabel: 'Days',
    presets: [
      preset(W.Last2Days, 'Dashboard:TimeWindow.Last2Days', 'Last 2 days'),
      preset(W.Last7Days, 'Dashboard:TimeWindow.Last7Days', 'Last 7 days'),
      preset(W.Last30Days, 'Dashboard:TimeWindow.Last30Days', 'Last 30 days'),
    ],
  },
  {
    labelKey: 'Dashboard:TimeWindow.Group.MonthsYears',
    defaultLabel: 'Months & years',
    presets: [
      preset(W.Last3Months, 'Dashboard:TimeWindow.Last3Months', 'Last 3 months'),
      preset(W.Last6Months, 'Dashboard:TimeWindow.Last6Months', 'Last 6 months'),
      preset(W.Last1Year, 'Dashboard:TimeWindow.Last1Year', 'Last 1 year'),
      preset(W.Last2Years, 'Dashboard:TimeWindow.Last2Years', 'Last 2 years'),
      preset(W.Last5Years, 'Dashboard:TimeWindow.Last5Years', 'Last 5 years'),
    ],
  },
  {
    labelKey: 'Dashboard:TimeWindow.Group.RelativeDays',
    defaultLabel: 'Relative days',
    presets: [
      preset(W.Today, 'Dashboard:TimeWindow.Today', 'Today'),
      preset(W.Yesterday, 'Dashboard:TimeWindow.Yesterday', 'Yesterday'),
      preset(W.DayBeforeYesterday, 'Dashboard:TimeWindow.DayBeforeYesterday', 'Day before yesterday'),
      preset(W.ThisDayLastWeek, 'Dashboard:TimeWindow.ThisDayLastWeek', 'This day last week'),
    ],
  },
  {
    labelKey: 'Dashboard:TimeWindow.Group.ToDate',
    defaultLabel: 'To date',
    presets: [
      preset(W.Wtd, 'Dashboard:TimeWindow.Wtd', 'This week (WTD)'),
      preset(W.Mtd, 'Dashboard:TimeWindow.Mtd', 'This month (MTD)'),
      preset(W.Qtd, 'Dashboard:TimeWindow.Qtd', 'This quarter (QTD)'),
      preset(W.Ytd, 'Dashboard:TimeWindow.Ytd', 'This year (YTD)'),
    ],
  },
  {
    labelKey: 'Dashboard:TimeWindow.Group.Previous',
    defaultLabel: 'Previous',
    presets: [
      preset(W.Pw, 'Dashboard:TimeWindow.Pw', 'Previous week (PW)'),
      preset(W.Pm, 'Dashboard:TimeWindow.Pm', 'Previous month (PM)'),
      preset(W.Pq, 'Dashboard:TimeWindow.Pq', 'Previous quarter (PQ)'),
      preset(W.Py, 'Dashboard:TimeWindow.Py', 'Previous year (PY)'),
    ],
  },
];

/** Flat list across all groups — for matching the active token. */
export const TIME_WINDOW_PRESETS: readonly TimeWindowPreset[] = TIME_WINDOW_GROUPS.flatMap(
  (group) => group.presets
);
