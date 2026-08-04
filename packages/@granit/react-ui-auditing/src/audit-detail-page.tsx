import { AuditLogProvider, useAuditLogEntry } from '@granit/react-auditing';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Spinner,
} from '@granit/react-ui';
import { EmptyState } from '@granit/react-ui-kit';
import { toEntityId } from '@granit/types';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';

import { AuditCategoryBadge } from './components/audit-category-badge';
import { AuditEntityChangeCard } from './components/audit-entity-change-card';
import { DEFAULT_AUDIT_BASE_PATH, DEFAULT_AUDIT_ROUTE_BASE } from './constants';

export interface AuditDetailPageProps {
  /** API mount path. Defaults to `/api/v1/auditing`. The Axios client resolves
   * from a `GranitClientProvider` higher in the tree — no client is injected. */
  readonly basePath?: string;
  /** Route base used for the "back to list" link. Defaults to `/auditing`. */
  readonly routeBase?: string;
}

export function AuditDetailPage({
  basePath = DEFAULT_AUDIT_BASE_PATH,
  routeBase = DEFAULT_AUDIT_ROUTE_BASE,
}: AuditDetailPageProps = {}) {
  return (
    <AuditLogProvider config={{ basePath }}>
      <AuditDetailContent routeBase={routeBase} />
    </AuditLogProvider>
  );
}

function AuditDetailContent({ routeBase }: { readonly routeBase: string }) {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const { id } = useParams<{ id: string }>();

  const entryId = toEntityId<'AuditEntry'>(id!); // NOSONAR: id is guaranteed by router
  const entryQuery = useAuditLogEntry(entryId);
  const entry = entryQuery.data;

  if (entryQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!entry) {
    return <EmptyState message={t('Audit.NotFound')} />;
  }

  return (
    <div data-slot="audit-detail-page" className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to={routeBase}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('Common.Back')}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{t('Audit.Detail')}</CardTitle>
            <AuditCategoryBadge category={entry.category} />
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Audit.Columns.Timestamp')}
              </dt>
              <dd className="mt-1 font-mono text-sm">{formatDateTime(entry.timestamp)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Audit.Columns.UserName')}
              </dt>
              <dd className="mt-1 text-sm">
                {entry.userName ?? (
                  <span className="italic text-muted-foreground/70">{t('Audit.System')}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Audit.Columns.IpAddress')}
              </dt>
              <dd className="mt-1 font-mono text-sm">{entry.ipAddress ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Audit.Columns.UserAgent')}
              </dt>
              <dd className="mt-1 break-all font-mono text-sm">{entry.userAgent ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Audit.Columns.CorrelationId')}
              </dt>
              <dd className="mt-1 font-mono text-sm">{entry.correlationId ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('Audit.Columns.TenantId')}
              </dt>
              <dd className="mt-1 font-mono text-sm">{entry.tenantId ?? '-'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{t('Audit.EntityChanges')}</h3>
        {entry.entityChanges.length > 0 ? (
          <div className="space-y-4">
            {entry.entityChanges.map((change, index) => (
              <AuditEntityChangeCard
                key={`${change.entityType}-${change.entityId}-${index}`}
                change={change}
              />
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('Audit.NoEntityChanges')}
          </p>
        )}
      </div>
    </div>
  );
}
