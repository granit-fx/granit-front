// ---------------------------------------------------------------------------
// DatePeriodPicker — period selector for date filters (Story #54)
// ---------------------------------------------------------------------------

import { useTranslation } from '@granit/react-localization';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@granit/react-ui';

import type { DateFilterMeta, DatePeriod } from '@granit/query-engine';

export interface DatePeriodPickerProps {
  /** Date filter metadata. */
  readonly dateFilter: DateFilterMeta;
  /** Currently selected period. */
  readonly value?: DatePeriod;
  /** Callback when period changes. */
  readonly onValueChange: (period: DatePeriod) => void;
  /** CSS class for the root container. */
  readonly className?: string;
}

/**
 * Period selector dropdown for date-based filtering.
 *
 * @example
 * ```tsx
 * <DatePeriodPicker
 *   dateFilter={meta.dateFilters[0]}
 *   value={selectedPeriod}
 *   onValueChange={setSelectedPeriod}
 * />
 * ```
 */
export function DatePeriodPicker({
  dateFilter,
  value,
  onValueChange,
  className,
}: Readonly<DatePeriodPickerProps>) {
  const { t } = useTranslation();

  const PERIOD_LABELS: Readonly<Record<DatePeriod, string>> = {
    Today: t('Components.Querying.DatePeriod.Today'),
    ThisWeek: t('Components.Querying.DatePeriod.ThisWeek'),
    ThisMonth: t('Components.Querying.DatePeriod.ThisMonth'),
    LastMonth: t('Components.Querying.DatePeriod.LastMonth'),
    ThisQuarter: t('Components.Querying.DatePeriod.ThisQuarter'),
    ThisYear: t('Components.Querying.DatePeriod.ThisYear'),
    Custom: t('Components.Querying.DatePeriod.Custom'),
  };

  return (
    <Select
      value={value ?? dateFilter.defaultPeriod}
      onValueChange={(v) => onValueChange(v as DatePeriod)}
    >
      <SelectTrigger data-slot="date-period-picker" className={className}>
        <SelectValue placeholder={t('Components.Querying.DatePeriod.SelectPeriod')} />
      </SelectTrigger>
      <SelectContent>
        {dateFilter.availablePeriods.map((period) => (
          <SelectItem key={period} value={period}>
            {PERIOD_LABELS[period]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
