import { AuditEntityChangesProvider, useAuditEntityChanges } from '@granit/react-auditing';
import { useTranslation } from '@granit/react-localization';
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@granit/react-ui';
import { QueryEndpointDataTable } from '@granit/react-ui-kit';
import { useMemo } from 'react';

import { createAuditEntityChangeColumns } from './components/audit-entity-change-columns';
import { DEFAULT_AUDIT_BASE_PATH, DEFAULT_AUDIT_ROUTE_BASE } from './constants';

import type { AuditChangeTypeValue } from '@granit/auditing';
import type { FilterEntry } from '@granit/query-engine';

const CHANGE_TYPES: AuditChangeTypeValue[] = ['Created', 'Modified', 'Deleted', 'SoftDeleted'];

const ENTITY_TYPE_FIELD = 'entityType';
const CHANGE_TYPE_FIELD = 'changeType';

/** Rebuild the full filter array, replacing the entry for `field`. */
function withFilter(
  current: readonly FilterEntry[] | undefined,
  field: string,
  operator: FilterEntry['operator'],
  value: string | undefined
): FilterEntry[] {
  const rest = (current ?? []).filter((f) => f.field !== field);
  return value ? [...rest, { field, operator, value }] : rest;
}

export interface AuditEntityChangesPageProps {
  /** API mount path. Defaults to `/api/v1/auditing`. The Axios client resolves
   * from a `GranitClientProvider` higher in the tree — no client is injected. */
  readonly basePath?: string;
  /** Route base used for the parent-entry detail links. Defaults to `/auditing`. */
  readonly routeBase?: string;
}

export function AuditEntityChangesPage({
  basePath = DEFAULT_AUDIT_BASE_PATH,
  routeBase = DEFAULT_AUDIT_ROUTE_BASE,
}: AuditEntityChangesPageProps = {}) {
  return (
    <AuditEntityChangesProvider basePath={basePath}>
      <AuditEntityChangesContent routeBase={routeBase} />
    </AuditEntityChangesProvider>
  );
}

function AuditEntityChangesContent({ routeBase }: { readonly routeBase: string }) {
  const { t } = useTranslation();
  const qe = useAuditEntityChanges();
  const { params, setFilters } = qe;
  const filters = params.filters;

  const columns = useMemo(
    () => createAuditEntityChangeColumns({ t, routeBase }),
    [t, routeBase]
  );

  const entityType = filters?.find((f) => f.field === ENTITY_TYPE_FIELD)?.value ?? '';
  const changeType = filters?.find((f) => f.field === CHANGE_TYPE_FIELD)?.value ?? 'all';

  return (
    <div data-slot="audit-entity-changes-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('Audit.EntityChangesTitle')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Audit.EntityChangesSubtitle')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={entityType}
          onChange={(e) =>
            setFilters(
              withFilter(filters, ENTITY_TYPE_FIELD, 'Contains', e.target.value.trim() || undefined)
            )
          }
          placeholder={t('Audit.Columns.EntityType')}
          aria-label={t('Audit.Columns.EntityType')}
          className="max-w-xs"
        />
        <Select
          value={changeType}
          onValueChange={(v) =>
            setFilters(withFilter(filters, CHANGE_TYPE_FIELD, 'Eq', v === 'all' ? undefined : v))
          }
        >
          <SelectTrigger className="w-[200px]" aria-label={t('Audit.Columns.ChangeType')}>
            <SelectValue placeholder={t('Audit.Columns.ChangeType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('Common.All')}</SelectItem>
            {CHANGE_TYPES.map((ct) => (
              <SelectItem key={ct} value={ct}>
                {t(`Audit.ChangeTypes.${ct}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QueryEndpointDataTable queryEndpoint={qe} columns={columns} />
    </div>
  );
}
