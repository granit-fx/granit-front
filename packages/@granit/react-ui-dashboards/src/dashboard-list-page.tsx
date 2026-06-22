import {
  detectVersionDrift,
  type DashboardCategory,
  type DashboardStatus,
} from '@granit/dashboards';
import {
  useArchiveDashboard,
  useDashboardCatalog,
  useDashboardList,
  useImportDashboard,
  usePublishDashboard,
  useRestoreDashboard,
  useResyncDashboard,
} from '@granit/react-dashboards';
import { useTranslation } from '@granit/react-localization';
import { Button, Spinner } from '@granit/react-ui';
import { Archive, ArchiveRestore, LayoutDashboard, Pencil, RefreshCw, Send } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { DriftBadge } from './components/dashboard-drift-badge';
import { DashboardImportFromCatalog } from './components/dashboard-import-from-catalog';
import { LifecycleConfirmDialog } from './components/dashboard-lifecycle-dialog';
import {
  LIFECYCLE_TOAST_DEFAULTS,
  actionTitle,
  pickStatusMutation,
  type PendingLifecycle,
} from './components/dashboard-lifecycle-types';
import { StatusBadge } from './components/dashboard-status-badge';

const STATUS_FILTERS: readonly (DashboardStatus | 'All')[] = [
  'All',
  'Draft',
  'Published',
  'Archived',
];

export function DashboardListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<DashboardStatus | 'All'>('All');
  const [catalogCategory, setCatalogCategory] = useState<DashboardCategory | undefined>();
  const [pending, setPending] = useState<PendingLifecycle | null>(null);

  const list = useDashboardList({
    status: statusFilter === 'All' ? undefined : statusFilter,
    page: 0,
    pageSize: 50,
  });
  const catalog = useDashboardCatalog({ category: catalogCategory });
  const importMutation = useImportDashboard();
  const publishMutation = usePublishDashboard();
  const archiveMutation = useArchiveDashboard();
  const restoreMutation = useRestoreDashboard();
  const resyncMutation = useResyncDashboard();

  const isPendingAny =
    publishMutation.isPending ||
    archiveMutation.isPending ||
    restoreMutation.isPending ||
    resyncMutation.isPending;

  if (list.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const items = list.data?.items ?? [];
  const catalogByName = new Map(catalog.data?.map((entry) => [entry.name, entry] as const));

  return (
    <div data-slot="dashboard-list-page" className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {t('Dashboards.List.Title', { defaultValue: 'Dashboards' })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('Dashboards.List.Subtitle', {
              defaultValue: 'Manage the dashboards exposed to your tenants.',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            data-slot="dashboard-list-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as DashboardStatus | 'All')}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {status === 'All'
                  ? t('Dashboards.List.StatusFilter.All', { defaultValue: 'All' })
                  : status}
              </option>
            ))}
          </select>
          <DashboardImportFromCatalog
            catalog={catalog.data ?? []}
            disabled={importMutation.isPending || !catalog.data}
            category={catalogCategory}
            onCategoryChange={setCatalogCategory}
            onImport={(name) =>
              importMutation.mutate(name, {
                onSuccess: (imported) =>
                  navigate(`/dashboards/manage/${encodeURIComponent(imported.id)}/edit`),
              })
            }
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-md border bg-card text-sm text-muted-foreground">
          <LayoutDashboard className="mb-2 h-8 w-8" />
          {t('Dashboards.List.Empty', { defaultValue: 'No dashboards yet.' })}
        </div>
      ) : (
        <ul data-slot="dashboard-list" className="space-y-2">
          {items.map((dashboard) => {
            const catalogEntry = dashboard.sourceDefinitionName
              ? catalogByName.get(dashboard.sourceDefinitionName)
              : undefined;
            const drift = detectVersionDrift(
              dashboard.sourceDefinitionVersion,
              catalogEntry?.version
            );
            return (
              <li
                key={dashboard.id}
                data-slot="dashboard-list-item"
                data-dashboard-id={dashboard.id}
                data-dashboard-status={dashboard.status}
                data-drift={drift}
                className="flex items-center justify-between rounded-md border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="h-5 w-5 text-muted-foreground" aria-hidden />
                  <div>
                    <p className="flex items-center gap-2 font-medium text-foreground">
                      {dashboard.name}
                      <DriftBadge drift={drift} catalogVersion={catalogEntry?.version ?? null} />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <StatusBadge status={dashboard.status} /> · {dashboard.category} ·{' '}
                      {dashboard.widgetCount}{' '}
                      {t('Dashboards.List.WidgetsSuffix', { defaultValue: 'widgets' })}
                      {dashboard.sourceDefinitionName ? (
                        <>
                          {' '}
                          · v{dashboard.sourceDefinitionVersion} · {dashboard.sourceDefinitionName}
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {drift === 'behind' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPendingAny}
                      onClick={() => setPending({ action: 'resync', dashboard })}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {t('Common.Resync', { defaultValue: 'Re-sync' })}
                    </Button>
                  )}
                  {dashboard.status === 'Draft' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPendingAny}
                      onClick={() => setPending({ action: 'publish', dashboard })}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {t('Common.Publish', { defaultValue: 'Publish' })}
                    </Button>
                  )}
                  {dashboard.status === 'Archived' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPendingAny}
                      onClick={() => setPending({ action: 'restore', dashboard })}
                    >
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                      {t('Common.Restore', { defaultValue: 'Restore' })}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPendingAny}
                      onClick={() => setPending({ action: 'archive', dashboard })}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      {t('Common.Archive', { defaultValue: 'Archive' })}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(`/dashboards/manage/${encodeURIComponent(dashboard.id)}/edit`)
                    }
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {t('Common.Edit', { defaultValue: 'Edit' })}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <LifecycleConfirmDialog
        pending={pending}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          const { action, dashboard } = pending;
          if (action === 'resync') {
            resyncMutation.mutate(dashboard.id, {
              onSuccess: (summary) => {
                toast.success(
                  t('Dashboards.List.Toast.ResyncSuccess', {
                    name: dashboard.name,
                    version: summary.sourceDefinitionVersion,
                    widgetsAdded: summary.widgetsAdded,
                    widgetsRemoved: summary.widgetsRemoved,
                    overridesCarriedOver: summary.overridesCarriedOver,
                    defaultValue:
                      'Re-synced "{{name}}" to v{{version}} · {{widgetsAdded}} added, {{widgetsRemoved}} removed, {{overridesCarriedOver}} overrides preserved',
                  })
                );
              },
              onSettled: () => setPending(null),
            });
            return;
          }
          const mutation = pickStatusMutation(action, {
            publishMutation,
            archiveMutation,
            restoreMutation,
          });
          mutation.mutate(dashboard.id, {
            onSuccess: () => {
              toast.success(
                t(`Dashboards.List.Toast.${actionTitle(action)}Success`, {
                  name: dashboard.name,
                  defaultValue: LIFECYCLE_TOAST_DEFAULTS[action].success(dashboard.name),
                })
              );
            },
            onSettled: () => setPending(null),
          });
        }}
        isPending={
          publishMutation.isPending ||
          archiveMutation.isPending ||
          restoreMutation.isPending ||
          resyncMutation.isPending
        }
      />
    </div>
  );
}
