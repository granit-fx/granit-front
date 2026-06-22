import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import type { DashboardCatalogEntryResponse, DashboardCategory } from '@granit/dashboards';

const CATALOG_CATEGORIES: readonly (DashboardCategory | 'All')[] = [
  'All',
  'General',
  'Finance',
  'Operations',
  'Security',
  'Compliance',
  'Platform',
  'Iot',
];

interface ImportFromCatalogControlProps {
  readonly catalog: readonly DashboardCatalogEntryResponse[];
  readonly disabled: boolean;
  readonly category: DashboardCategory | undefined;
  readonly onCategoryChange: (category: DashboardCategory | undefined) => void;
  readonly onImport: (definitionName: string) => void;
}

export function DashboardImportFromCatalog({
  catalog,
  disabled,
  category,
  onCategoryChange,
  onImport,
}: ImportFromCatalogControlProps) {
  const { t } = useTranslation();
  const [selectedName, setSelectedName] = useState<string>('');
  return (
    <div className="flex items-center gap-2">
      <select
        data-slot="dashboard-import-category-filter"
        value={category ?? 'All'}
        onChange={(event) => {
          const value = event.target.value;
          setSelectedName('');
          onCategoryChange(value === 'All' ? undefined : (value as DashboardCategory));
        }}
        disabled={disabled}
        className="rounded-md border bg-background px-3 py-1.5 text-sm"
      >
        {CATALOG_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat === 'All'
              ? t('Dashboards.List.CatalogCategoryFilter.All', { defaultValue: 'All categories' })
              : cat}
          </option>
        ))}
      </select>
      <select
        data-slot="dashboard-import-catalog-select"
        value={selectedName}
        onChange={(event) => setSelectedName(event.target.value)}
        disabled={disabled || catalog.length === 0}
        className="rounded-md border bg-background px-3 py-1.5 text-sm"
      >
        <option value="">
          {t('Dashboards.List.ImportFromCatalogPlaceholder', {
            defaultValue: '— Import from catalog —',
          })}
        </option>
        {catalog.map((entry) => (
          <option key={entry.name} value={entry.name}>
            {entry.name} (v{entry.version})
          </option>
        ))}
      </select>
      <Button
        size="sm"
        disabled={disabled || selectedName === ''}
        onClick={() => {
          if (selectedName !== '') {
            onImport(selectedName);
            setSelectedName('');
          }
        }}
      >
        <Plus className="mr-2 h-4 w-4" />
        {t('Common.Import', { defaultValue: 'Import' })}
      </Button>
    </div>
  );
}
