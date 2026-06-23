import { usePermissions } from '@granit/react-authorization';
import { DataExchangeProvider } from '@granit/react-data-exchange';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  TenantAdminProvider,
  useActivateTenant,
  useDeactivateTenant,
} from '@granit/react-multi-tenancy';
import {
  QueryProvider,
  useQueryEndpoint,
  useQueryMeta,
  useSmartFilter,
} from '@granit/react-query-engine';
import { Button, Spinner } from '@granit/react-ui';
import {
  FilterPresets,
  GroupBySelector,
  QueryEndpointDataTable,
  SmartFilterBar,
  SortSelector,
  useOperatorLabels,
  useSmartFilterSync,
} from '@granit/react-ui-admin-kit';
import { ExportButton, ExportDialog } from '@granit/react-ui-data-exchange';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { createTenantColumns } from './components/tenant-columns';
import { TenantStatusDialog } from './components/tenant-status-dialog';

import type { TenantQueryItem } from './components/types';
import type { QueryConfig } from '@granit/query-engine';

const QUERY_CONFIG: QueryConfig = {
  basePath: '/api/v1/multi-tenancy/tenants',
};

export function TenantListPage() {
  return (
    <TenantAdminProvider config={{}}>
      <QueryProvider config={QUERY_CONFIG}>
        <DataExchangeProvider>
          <TenantListContent />
        </DataExchangeProvider>
      </QueryProvider>
    </TenantAdminProvider>
  );
}

function TenantListContent() {
  const { t } = useTranslation();
  const { formatDate } = useDateFormatter();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('MultiTenancy.Tenants.Create');
  const canUpdate = hasPermission('MultiTenancy.Tenants.Update');
  const canManage = hasPermission('MultiTenancy.Tenants.Manage');

  const activateMutation = useActivateTenant();
  const deactivateMutation = useDeactivateTenant();
  const queryClient = useQueryClient();
  const tenantQueryKeyPrefix = useMemo(() => QUERY_CONFIG.basePath.split('/').filter(Boolean), []);

  // Dialog state
  const [statusTarget, setStatusTarget] = useState<TenantQueryItem | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // @granit/query-engine hooks
  const meta = useQueryMeta();
  const queryEndpoint = useQueryEndpoint<TenantQueryItem>({
    initialParams: {
      page: 1,
      pageSize: 20,
      sort: [{ field: 'name', direction: 'asc' }],
      presets: { status: ['active'] },
    },
  });
  const operatorLabels = useOperatorLabels();
  const smartFilter = useSmartFilter({
    metadata: meta.data,
    booleanLabels: { true: t('Common.Yes'), false: t('Common.No') },
    operatorLabels,
  });
  const { handlePresetToggle } = useSmartFilterSync(smartFilter, queryEndpoint, meta);

  const handleEdit = useCallback(
    (id: string) => {
      navigate(`/tenants/${id}/edit`);
    },
    [navigate]
  );

  const handleToggleStatus = useCallback((tenant: TenantQueryItem) => {
    setStatusTarget(tenant);
  }, []);

  function handleStatusConfirm() {
    if (!statusTarget) return;
    const mutation = statusTarget.activated ? deactivateMutation : activateMutation;
    const successKey = statusTarget.activated
      ? 'Tenants.DeactivateSuccess'
      : 'Tenants.ActivateSuccess';

    mutation.mutate(statusTarget.id, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: tenantQueryKeyPrefix });
        toast.success(t(successKey));
        setStatusTarget(null);
      },
    });
  }

  const columns = useMemo(
    () =>
      createTenantColumns({
        t,
        formatDate,
        onEdit: handleEdit,
        onToggleStatus: handleToggleStatus,
        canUpdate,
        canManage,
      }),
    [t, formatDate, handleEdit, handleToggleStatus, canUpdate, canManage]
  );

  if (meta.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div data-slot="tenant-list-page" className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('Tenants.Title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('Tenants.Subtitle')}</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link to="/tenants/new">
              <Plus className="mr-2 size-4" />
              {t('Tenants.CreateButton')}
            </Link>
          </Button>
        )}
      </div>

      {/* Smart filter bar */}
      {meta.data && (
        <div className="flex flex-col gap-4">
          <SmartFilterBar smartFilter={smartFilter} placeholder={t('Common.SearchPlaceholder')} />

          {meta.data.presetFilterGroups.length > 0 && (
            <FilterPresets
              groups={meta.data.presetFilterGroups}
              activePresets={smartFilter.presets}
              onToggle={handlePresetToggle}
            />
          )}

          <div className="flex items-center gap-2">
            <SortSelector
              columns={meta.data.columns}
              sort={queryEndpoint.params.sort}
              onToggleSort={queryEndpoint.toggleSort}
            />
            {meta.data.groupByFields.length > 0 && (
              <GroupBySelector
                fields={meta.data.groupByFields}
                columns={meta.data.columns}
                value={queryEndpoint.params.groupBy}
                onValueChange={queryEndpoint.setGroupBy}
              />
            )}
            <ExportButton
              onExport={() => setExportOpen(true)}
              label={t('DataExchange.Export.Label')}
            />
          </div>
        </div>
      )}

      {/* Data table */}
      <QueryEndpointDataTable queryEndpoint={queryEndpoint} columns={columns} />

      <ExportDialog
        definitionName="Granit.MultiTenancy.TenantExport"
        open={exportOpen}
        onOpenChange={setExportOpen}
        sort={queryEndpoint.params.sort
          ?.map((s) => (s.direction === 'desc' ? `-${s.field}` : s.field))
          .join(',')}
        filter={Object.fromEntries(
          queryEndpoint.params.filters?.map((f) => [`${f.field}.${f.operator}`, f.value]) ?? []
        )}
        search={queryEndpoint.params.search}
      />

      {/* Status toggle dialog */}
      {statusTarget && (
        <TenantStatusDialog
          tenantName={statusTarget.name}
          action={statusTarget.activated ? 'deactivate' : 'activate'}
          open={statusTarget !== null}
          onOpenChange={(open) => {
            if (!open) setStatusTarget(null);
          }}
          onConfirm={handleStatusConfirm}
          isPending={activateMutation.isPending || deactivateMutation.isPending}
        />
      )}
    </div>
  );
}
