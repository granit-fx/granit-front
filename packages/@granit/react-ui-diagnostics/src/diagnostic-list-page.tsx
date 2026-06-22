import { useGranitClient } from '@granit/react-api-client';
import { useMonitoringHealth } from '@granit/react-diagnostics';
import { useTranslation } from '@granit/react-localization';
import { Skeleton } from '@granit/react-ui';

import { AutoRefreshIndicator } from './components/auto-refresh-indicator';
import { ServiceHealthCard } from './components/service-health-card';

export function DiagnosticListPage() {
  const { t } = useTranslation();
  const client = useGranitClient();
  const { data, isLoading, isFetching, refetch } = useMonitoringHealth({
    client,
    refetchInterval: 30_000,
  });

  return (
    <div data-slot="diagnostic-list-page" className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('Diagnostics.Title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('Diagnostics.Subtitle')}</p>
        </div>
        <AutoRefreshIndicator
          onRefresh={() => {
            refetch();
          }}
          isRefreshing={isFetching}
        />
      </div>

      {/* Service health grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={`skeleton-${i}`} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.services.map((service) => (
            <ServiceHealthCard key={service.id} service={service} checkedAt={data.checkedAt} />
          ))}
        </div>
      )}
    </div>
  );
}
