import { AuditLogProvider, useAuditEntries } from '@granit/react-auditing';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@granit/react-ui';
import { QueryEndpointDataTable } from '@granit/react-ui-kit';
import { useMemo } from 'react';

import { createAuditColumns } from './components/audit-columns';
import { DEFAULT_AUDIT_BASE_PATH, DEFAULT_AUDIT_ROUTE_BASE } from './constants';

import type { AuditCategoryValue } from '@granit/auditing';

const CATEGORIES: AuditCategoryValue[] = [
  'DataMutation',
  'ConfigurationChange',
  'DataAccess',
  'AccessDenied',
  'PrivilegedAccess',
];

export interface AuditListPageProps {
  /** API mount path. Defaults to `/api/v1/auditing`. The Axios client resolves
   * from a `GranitClientProvider` higher in the tree — no client is injected. */
  readonly basePath?: string;
  /** Route base used for the detail links. Defaults to `/auditing`. */
  readonly routeBase?: string;
}

export function AuditListPage({
  basePath = DEFAULT_AUDIT_BASE_PATH,
  routeBase = DEFAULT_AUDIT_ROUTE_BASE,
}: AuditListPageProps = {}) {
  return (
    <AuditLogProvider config={{ basePath }}>
      <AuditPageContent routeBase={routeBase} />
    </AuditLogProvider>
  );
}

function AuditPageContent({ routeBase }: { readonly routeBase: string }) {
  const { t } = useTranslation();
  // Query-engine surface: pagination, sort and filters are driven server-side by
  // `QueryEndpointDataTable`. Category is a first-class filterable field, so the
  // dropdown sets `filter[category.eq]` and is honored by the backend.
  const qe = useAuditEntries();
  const { params, setFilters } = qe;
  const { formatDateTime } = useDateFormatter();
  const columns = useMemo(
    () => createAuditColumns({ t, formatDateTime, routeBase }),
    [t, formatDateTime, routeBase]
  );

  const category = params.filters?.find((f) => f.field === 'category')?.value;

  return (
    <div data-slot="audit-list-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{t('Audit.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Audit.Subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select
          value={category ?? 'all'}
          onValueChange={(v) =>
            setFilters(v === 'all' ? [] : [{ field: 'category', operator: 'Eq', value: v }])
          }
        >
          <SelectTrigger className="w-[200px]" aria-label={t('Audit.FilterByCategory')}>
            <SelectValue placeholder={t('Audit.FilterByCategory')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('Common.All')}</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {t(`Audit.Categories.${cat}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QueryEndpointDataTable queryEndpoint={qe} columns={columns} />
    </div>
  );
}
