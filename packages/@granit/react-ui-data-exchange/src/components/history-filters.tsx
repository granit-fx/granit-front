import { useTranslation } from '@granit/react-localization';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@granit/react-ui';

import { EXPORT_STATUSES, IMPORT_STATUSES } from '../constants';

import type { ExportJobStatus, ImportJobStatus } from '@granit/data-exchange';

interface HistoryFiltersProps {
  readonly mode: 'import' | 'export';
  readonly status: string | undefined;
  readonly onStatusChange: (value: string | undefined) => void;
}

export function HistoryFilters({ mode, status, onStatusChange }: HistoryFiltersProps) {
  const { t } = useTranslation();
  const statuses: readonly string[] = mode === 'import' ? IMPORT_STATUSES : EXPORT_STATUSES;

  return (
    <div data-slot="history-filters" className="flex items-center gap-3">
      <Select
        value={status ?? 'all'}
        onValueChange={(v) => onStatusChange(v === 'all' ? undefined : v)}
      >
        <SelectTrigger className="w-48" aria-label={t('DataExchange.Filters.Status')}>
          <SelectValue placeholder={t('DataExchange.Filters.AllStatuses')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('DataExchange.Filters.AllStatuses')}</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {t(`DataExchange.Status.${s as ImportJobStatus | ExportJobStatus}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
