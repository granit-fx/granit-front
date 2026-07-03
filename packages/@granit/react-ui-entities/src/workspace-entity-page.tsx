import {
  EntityListPageHeader,
  EntitySelectionBar,
  SelectionProvider,
  useEntityDiscovery,
  useEntityMetadata,
  useInvalidateEntityRelationAggregates,
  useSelection,
  type EntityActionHandlers,
  type EntitySelectionBarRecap,
} from '@granit/react-entities';
import { resolveLabel, useDateFormatter, useTranslation } from '@granit/react-localization';
import {
  formatCell,
  QueryEndpointStateProvider,
  QueryProvider,
  useQueryEndpoint,
  useQueryMeta,
  useSmartFilter,
  type DateFormatter,
} from '@granit/react-query-engine';
import { Button, Skeleton, Spinner, Checkbox, toast } from '@granit/react-ui';
import {
  ConfirmActionDialog,
  FilterPresets,
  GroupBySelector,
  QueryDataTable,
  SmartFilterBar,
  SortSelector,
  useOperatorLabels,
  useSmartFilterSync,
} from '@granit/react-ui-kit';
import { useSidePeek } from '@granit/react-workspaces';
import { ChevronRight, Pencil, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { recapParentRefs } from './bulk-recap';
import { useEntityActionScope } from './entity-action-scope';
import { EntityCalendarView } from './entity-calendar-view';
import { EntityGalleryView, type GalleryRenderImage } from './entity-gallery-view';
import { EntityKanbanView } from './entity-kanban-view';
import { EntityPageLayout } from './entity-page-layout';
import { EntityViewSwitcher } from './entity-view-switcher';
import { asExtended } from './manifest-extensions';

import type { ExtendedEntityManifest } from './manifest-extensions';
import type {
  EntityListLayoutKind,
  EntityListLayoutManifest,
  EntityManifestResponse,
  EntitySelectionActionManifest,
} from '@granit/entities';
import type { QueryMetadata } from '@granit/query-engine';
import type { ColumnDef } from '@tanstack/react-table';

// Builds TanStack table columns from the QueryMetadata + manifest field
// widget hints. Cell rendering picks a formatter based on the widget id
// (money / date / datetime) or column type (DateTime ISO fallback). No
// entity-specific knowledge.
interface RowActionLabels {
  readonly open: string;
  readonly edit: string;
  readonly selectRow: string;
  readonly selectAll: string;
}

interface SelectionColumnArgs {
  readonly visibleIds: readonly string[];
  readonly selectedIds: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
  readonly onSelectAll: (ids: readonly string[]) => void;
  readonly onClear: () => void;
}

function resolveSelectAllChecked(
  visibleCount: number,
  selectedVisible: number
): boolean | 'indeterminate' {
  if (visibleCount > 0 && selectedVisible === visibleCount) return true;
  if (selectedVisible === 0) return false;
  return 'indeterminate';
}

interface CreateGenericColumnsArgs {
  readonly meta: QueryMetadata;
  readonly fieldComponents: ReadonlyMap<string, string>;
  readonly currencyResolver: (row: Readonly<Record<string, unknown>>) => string;
  readonly locale: string;
  readonly formatDate: DateFormatter;
  readonly formatDateTime: DateFormatter;
  readonly labels: RowActionLabels;
  readonly onView: (id: string) => void;
  readonly onEdit: ((id: string) => void) | null;
  readonly selection: SelectionColumnArgs | null;
}

function createGenericColumns({
  meta,
  fieldComponents,
  currencyResolver,
  locale,
  formatDate,
  formatDateTime,
  labels,
  onView,
  onEdit,
  selection,
}: CreateGenericColumnsArgs): ColumnDef<Readonly<Record<string, unknown>>, unknown>[] {
  const dataColumns = meta.columns
    .filter((c) => c.isVisible)
    .sort((a, b) => a.order - b.order)
    .map((col): ColumnDef<Readonly<Record<string, unknown>>, unknown> => {
      const pascalKey = col.name.charAt(0).toUpperCase() + col.name.slice(1);
      const component = fieldComponents.get(pascalKey);
      return {
        accessorKey: col.name,
        header: col.label,
        cell: ({ row }) =>
          formatCell({
            row: row.original,
            column: col,
            component,
            currencyResolver,
            locale,
            formatDate,
            formatDateTime,
          }),
      };
    });

  // Generic row-actions column appended at the end. The buttons (Edit
  // pencil + Open chevron) are gated by their respective callbacks —
  // `null` means the manifest didn't grant the permission, so the
  // button is omitted entirely. Replaces every per-entity actions cell
  // (`createPartyColumns` / `createInvoiceColumns` etc.) — adding a new
  // entity downstream gets the actions bar for free.
  const actionsColumn: ColumnDef<Readonly<Record<string, unknown>>, unknown> = {
    id: '__actions',
    header: '',
    cell: ({ row }) => {
      const id = (row.original as { readonly id?: string }).id;
      if (!id) return null;
      return (
        <div className="flex items-center justify-end gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              aria-label={labels.edit}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(id);
              }}
            >
              <Pencil className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            aria-label={labels.open}
            onClick={(e) => {
              e.stopPropagation();
              onView(id);
            }}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      );
    },
  };

  if (!selection) {
    return [...dataColumns, actionsColumn];
  }

  const selectionColumn: ColumnDef<Readonly<Record<string, unknown>>, unknown> = {
    id: '__select',
    header: () => {
      const visibleCount = selection.visibleIds.length;
      const selectedVisible = selection.visibleIds.filter((id) =>
        selection.selectedIds.has(id)
      ).length;
      const checked = resolveSelectAllChecked(visibleCount, selectedVisible);
      return (
        <Checkbox
          aria-label={labels.selectAll}
          checked={checked}
          onCheckedChange={(next) => {
            if (next === true) {
              selection.onSelectAll(selection.visibleIds);
            } else {
              selection.onClear();
            }
          }}
          onClick={(e) => e.stopPropagation()}
        />
      );
    },
    cell: ({ row }) => {
      const id = (row.original as { readonly id?: string }).id;
      if (!id) return null;
      return (
        <Checkbox
          aria-label={labels.selectRow}
          checked={selection.selectedIds.has(id)}
          onCheckedChange={() => selection.onToggle(id)}
          onClick={(e) => e.stopPropagation()}
        />
      );
    },
  };

  return [selectionColumn, ...dataColumns, actionsColumn];
}

interface ContentProps {
  readonly workspaceName: string;
  readonly entityName: string;
  readonly title: string;
  readonly subtitle: string;
  readonly canCreate: boolean;
  readonly canUpdate: boolean;
  readonly fieldComponents: ReadonlyMap<string, string>;
  readonly listLayouts: readonly EntityListLayoutManifest[];
  readonly manifest: ExtendedEntityManifest;
  readonly renderImage: GalleryRenderImage;
}

function WorkspaceEntityContent({
  workspaceName,
  entityName,
  title,
  subtitle,
  canCreate,
  canUpdate,
  fieldComponents,
  listLayouts,
  manifest,
  renderImage,
}: ContentProps) {
  const { t, i18n } = useTranslation();
  const { formatDate, formatDateTime } = useDateFormatter();
  const navigate = useNavigate();
  const location = useLocation();
  const meta = useQueryMeta();
  const { setEntityName } = useEntityActionScope();
  useEffect(() => {
    setEntityName(entityName);
    return () => setEntityName(null);
  }, [entityName, setEntityName]);
  const { openPeek } = useSidePeek({
    search: location.search,
    onSearchChange: (next) =>
      navigate({ pathname: location.pathname, search: next }, { replace: true }),
    onExpand: (fullPath) => navigate(fullPath),
  });

  const [activeKind, setActiveKind] = useState<EntityListLayoutKind>(
    () => listLayouts.find((l) => l.isDefault)?.kind ?? listLayouts[0]?.kind ?? 'List'
  );
  const activeLayout = listLayouts.find((l) => l.kind === activeKind) ?? listLayouts[0];

  // Initial params are seeded by the ambient `<QueryEndpointStateProvider>`
  // (set in `WorkspaceEntityPage` below) — passing them here would be
  // ignored, so we omit them for clarity.
  const queryEndpoint = useQueryEndpoint<Readonly<Record<string, unknown>>>();

  const operatorLabels = useOperatorLabels();
  const smartFilter = useSmartFilter({
    metadata: meta.data,
    booleanLabels: { true: t('Common.Yes'), false: t('Common.No') },
    operatorLabels,
  });
  const { handlePresetToggle } = useSmartFilterSync(smartFilter, queryEndpoint, meta);

  // Click on a row opens the side-peek drawer; the keyboard shortcut
  // `⌘+⇧+.` (handled by `useSidePeek`) expands the peek to the full
  // detail page (`/w/{ws}/{entity}/{id}`).
  const handleViewDetail = useCallback(
    (id: string) => openPeek({ entityName, entityId: id }),
    [openPeek, entityName]
  );

  const handleEdit = useCallback(
    (id: string) =>
      navigate(
        `/w/${encodeURIComponent(workspaceName)}/${encodeURIComponent(entityName)}/${encodeURIComponent(id)}/edit`
      ),
    [navigate, workspaceName, entityName]
  );

  // Override the framework's default `Navigate` handler so urlTemplate-based
  // actions stay in-app (React Router push) rather than triggering a full
  // page load. Other kinds (`ApiCall` / `Download` / `WorkflowTransition`)
  // fall back to the framework defaults, which already use the ambient
  // `useGranitClient()` axios instance.
  const actionHandlers = useMemo<EntityActionHandlers>(
    () => ({
      navigate: (action, rowId) => {
        if (!action.urlTemplate) return;
        const url = rowId
          ? action.urlTemplate.replaceAll('{id}', encodeURIComponent(rowId))
          : action.urlTemplate;
        navigate(url);
      },
    }),
    [navigate]
  );

  const currencyResolver = useCallback(
    (row: Readonly<Record<string, unknown>>) =>
      (row.currency as string | undefined) ?? (row.defaultCurrency as string | undefined) ?? 'EUR',
    []
  );

  const rowActionLabels = useMemo<RowActionLabels>(
    () => ({
      open: t('Common.Open', 'Open'),
      edit: t('Common.Edit', 'Edit'),
      selectRow: t('Common.SelectionAction.SelectRow', 'Select row'),
      selectAll: t('Common.SelectionAction.SelectAll', 'Select all'),
    }),
    [t]
  );

  const selection = useSelection();
  const visibleIds = useMemo(() => {
    const items = queryEndpoint.query.data?.items ?? [];
    return items
      .map((row) => (row as { readonly id?: string }).id)
      .filter((id): id is string => typeof id === 'string');
  }, [queryEndpoint.query.data?.items]);
  const hasSelectionActions = (manifest.collections?.selectionActions?.length ?? 0) > 0;
  const selectionArgs = useMemo<SelectionColumnArgs | null>(
    () =>
      hasSelectionActions
        ? {
            visibleIds,
            selectedIds: selection.selectedIds,
            onToggle: selection.toggle,
            onSelectAll: (ids) => selection.setSelected(ids),
            onClear: selection.clear,
          }
        : null,
    [hasSelectionActions, visibleIds, selection]
  );

  const columns = useMemo(
    () =>
      meta.data
        ? createGenericColumns({
            meta: meta.data,
            fieldComponents,
            currencyResolver,
            locale: i18n.language,
            formatDate,
            formatDateTime,
            labels: rowActionLabels,
            onView: handleViewDetail,
            onEdit: canUpdate ? handleEdit : null,
            selection: selectionArgs,
          })
        : [],
    [
      meta.data,
      fieldComponents,
      currencyResolver,
      i18n.language,
      formatDate,
      formatDateTime,
      rowActionLabels,
      handleViewDetail,
      canUpdate,
      handleEdit,
      selectionArgs,
    ]
  );

  const invalidateAggregates = useInvalidateEntityRelationAggregates();
  const handleRecap = useCallback(
    (action: EntitySelectionActionManifest, recap: EntitySelectionBarRecap) => {
      const verb = action.displayKey ? t(action.displayKey, action.name) : action.name;
      if (recap.failed.length === 0) {
        toast.success(
          t('Common.SelectionAction.AllSucceeded', '{{count}} {{verb}} succeeded', {
            count: recap.succeeded.length,
            verb,
          })
        );
      } else if (recap.succeeded.length === 0) {
        toast.error(
          t('Common.SelectionAction.AllFailed', '{{count}} {{verb}} failed', {
            count: recap.failed.length,
            verb,
          })
        );
      } else {
        toast.warning(
          t('Common.SelectionAction.PartialFailure', '{{ok}} succeeded, {{ko}} failed', {
            ok: recap.succeeded.length,
            ko: recap.failed.length,
          })
        );
      }
      // Phase 2 (#398) — when the bulk endpoint surfaces impacted
      // parents (`"{ParentEntityName}:{ParentId}"` markers), invalidate
      // exactly those relation-aggregate caches so smart-button counts
      // refresh without re-fetching everything. Per-row fan-out path
      // returns `recap.parents === undefined` and this is a no-op.
      const parentRefs = recapParentRefs(recap);
      if (parentRefs.length > 0) {
        invalidateAggregates(parentRefs);
      }
    },
    [t, invalidateAggregates]
  );

  const [pendingConfirm, setPendingConfirm] = useState<{
    readonly action: EntitySelectionActionManifest;
    readonly count: number;
    readonly resolve: (proceed: boolean) => void;
  } | null>(null);

  const handleConfirm = (
    _action: EntitySelectionActionManifest,
    selectedIds: ReadonlySet<string>
  ): Promise<boolean> =>
    new Promise<boolean>((resolve) => {
      setPendingConfirm({ action: _action, count: selectedIds.size, resolve });
    });

  if (meta.isLoading) {
    return (
      <EntityPageLayout title={title} subtitle={subtitle} contentWidth="full">
        <div className="flex h-64 items-center justify-center" data-slot="workspace-entity-loading">
          <Spinner />
        </div>
      </EntityPageLayout>
    );
  }

  const totalCount = queryEndpoint.isGrouped
    ? (queryEndpoint.groupedQuery.data?.totalCount ?? 0)
    : (queryEndpoint.query.data?.totalCount ?? 0);

  return (
    <EntityPageLayout
      dataSlot="workspace-entity-page"
      contentWidth="full"
      title={title}
      subtitle={subtitle}
      actions={
        canCreate && (
          <Button
            size="sm"
            onClick={() =>
              navigate(
                `/w/${encodeURIComponent(workspaceName)}/${encodeURIComponent(entityName)}/new`
              )
            }
            data-slot="workspace-entity-create"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('Common.Create', 'Create')}
          </Button>
        )
      }
      viewSwitcher={
        <div className="flex flex-col gap-3">
          <EntityListPageHeader
            manifest={manifest as unknown as EntityManifestResponse}
            handlers={actionHandlers}
          />
          <EntityViewSwitcher
            layouts={listLayouts}
            activeKind={activeKind}
            onChange={setActiveKind}
          />
        </div>
      }
      queryControls={
        // Filter / search stay rendered across every layout — they
        // reach the active renderer through the ambient
        // `<QueryEndpointStateProvider>`. Sort / GroupBy are gated by
        // the renderer matrix from granit-front #348 to avoid
        // surfacing knobs that turn no-ops on the active layout:
        //
        //   - Calendar  → no Sort, no GroupBy (n/a on a time axis)
        //   - Kanban    → no GroupBy (layout-locked, server strips ambient)
        //   - Gallery   → all controls visible (runtime groupBy pivot
        //                 honored by the framework since granit-front #350)
        //   - List      → all controls visible
        meta.data && (
          <>
            <SmartFilterBar
              smartFilter={smartFilter}
              placeholder={t('Common.SearchPlaceholder', 'Search or filter…')}
            />
            {meta.data.presetFilterGroups.length > 0 && (
              <FilterPresets
                groups={meta.data.presetFilterGroups}
                activePresets={smartFilter.presets}
                onToggle={handlePresetToggle}
              />
            )}
            <div className="flex items-center gap-2">
              {activeKind !== 'Calendar' && (
                <SortSelector
                  columns={meta.data.columns}
                  sort={queryEndpoint.params.sort}
                  onToggleSort={queryEndpoint.toggleSort}
                />
              )}
              {activeKind !== 'Calendar' &&
                activeKind !== 'Kanban' &&
                meta.data.groupByFields.length > 0 && (
                  <GroupBySelector
                    fields={meta.data.groupByFields}
                    columns={meta.data.columns}
                    value={queryEndpoint.params.groupBy}
                    onValueChange={queryEndpoint.setGroupBy}
                  />
                )}
              <span className="ml-auto text-sm text-muted-foreground">
                {totalCount} {t('Common.Records', 'records')}
              </span>
            </div>
          </>
        )
      }
    >
      {renderLayoutBody({
        activeLayout,
        entityName,
        manifest,
        canUpdate,
        locale: i18n.language,
        columns,
        queryEndpoint,
        totalCount,
        onItemClick: handleViewDetail,
        actionHandlers,
        renderImage,
      })}
      <EntitySelectionBar
        manifest={manifest as unknown as EntityManifestResponse}
        handlers={actionHandlers}
        onComplete={handleRecap}
        confirm={handleConfirm}
        // Phase 2 (#398) — opt every selection action through the bulk
        // endpoint so the backend dedupes server-side and surfaces
        // impacted parents in one batched response (consumed by
        // `handleRecap` via `useInvalidateEntityRelationAggregates`).
        bulkEndpoint
        className="sticky bottom-4 z-30 mx-auto mt-4 flex w-fit items-center gap-2 rounded-lg border bg-background px-3 py-2 shadow-lg [&_[data-granit-entity-action]]:inline-flex [&_[data-granit-entity-action]]:h-8 [&_[data-granit-entity-action]]:items-center [&_[data-granit-entity-action]]:rounded-md [&_[data-granit-entity-action]]:border [&_[data-granit-entity-action]]:bg-background [&_[data-granit-entity-action]]:px-3 [&_[data-granit-entity-action]]:text-sm [&_[data-granit-entity-action]]:font-medium [&_[data-granit-entity-action]]:hover:bg-accent [&_[data-granit-entity-action]]:disabled:opacity-50 [&_[data-granit-entity-action][data-running]]:animate-pulse [&_[data-granit-selection-bar-clear]]:inline-flex [&_[data-granit-selection-bar-clear]]:h-8 [&_[data-granit-selection-bar-clear]]:items-center [&_[data-granit-selection-bar-clear]]:rounded-md [&_[data-granit-selection-bar-clear]]:px-3 [&_[data-granit-selection-bar-clear]]:text-sm [&_[data-granit-selection-bar-clear]]:text-muted-foreground [&_[data-granit-selection-bar-clear]]:hover:bg-accent [&_[data-granit-selection-bar-summary]]:text-sm [&_[data-granit-selection-bar-summary]]:font-medium"
      />
      <ConfirmActionDialog
        open={pendingConfirm !== null}
        onOpenChange={(open) => {
          if (!open && pendingConfirm) {
            pendingConfirm.resolve(false);
            setPendingConfirm(null);
          }
        }}
        tone="destructive"
        title={
          pendingConfirm?.action.confirmationKey
            ? t(pendingConfirm.action.confirmationKey, t('Common.Confirm', 'Confirm'))
            : t('Common.Confirm', 'Confirm')
        }
        description={t(
          'Common.SelectionAction.ConfirmCount',
          'Apply to {{count}} selected record(s)?',
          { count: pendingConfirm?.count ?? 0 }
        )}
        confirmLabel={t('Common.Confirm', 'Confirm')}
        cancelLabel={t('Common.Cancel', 'Cancel')}
        onConfirm={() => {
          pendingConfirm?.resolve(true);
          setPendingConfirm(null);
        }}
      />
    </EntityPageLayout>
  );
}

interface LayoutBodyArgs {
  readonly activeLayout: EntityListLayoutManifest | undefined;
  readonly entityName: string;
  readonly manifest: ExtendedEntityManifest;
  readonly canUpdate: boolean;
  readonly locale: string;
  readonly columns: ColumnDef<Readonly<Record<string, unknown>>, unknown>[];
  readonly queryEndpoint: ReturnType<typeof useQueryEndpoint<Readonly<Record<string, unknown>>>>;
  readonly totalCount: number;
  readonly onItemClick: (id: string) => void;
  readonly actionHandlers: EntityActionHandlers;
  readonly renderImage: GalleryRenderImage;
}

// Generic switch on the active list layout. Each branch mounts the
// host-side renderer with the per-kind config carried in the manifest.
// Adding a new kind upstream is one additional `case` here — no
// per-entity branching ever surfaces.
function renderLayoutBody({
  activeLayout,
  entityName,
  manifest,
  canUpdate,
  locale,
  columns,
  queryEndpoint,
  totalCount,
  onItemClick,
  actionHandlers,
  renderImage,
}: LayoutBodyArgs) {
  switch (activeLayout?.kind) {
    case 'Calendar':
      return activeLayout.calendar ? (
        <EntityCalendarView
          entityName={entityName}
          manifest={manifest}
          layout={activeLayout.calendar}
          onItemClick={onItemClick}
          actionHandlers={actionHandlers}
        />
      ) : null;
    case 'Kanban':
      return activeLayout.kanban ? (
        <EntityKanbanView
          entityName={entityName}
          manifest={manifest}
          layout={activeLayout.kanban}
          rows={queryEndpoint.query.data?.items ?? []}
          canUpdate={canUpdate}
          locale={locale}
          onCardClick={onItemClick}
          actionHandlers={actionHandlers}
        />
      ) : null;
    case 'Gallery':
      return activeLayout.gallery ? (
        <EntityGalleryView
          manifest={manifest}
          layout={activeLayout.gallery}
          onCardClick={onItemClick}
          actionHandlers={actionHandlers}
          renderImage={renderImage}
        />
      ) : null;
    case 'List':
    default:
      return (
        <QueryDataTable
          columns={columns}
          data={queryEndpoint.isGrouped ? [] : (queryEndpoint.query.data?.items ?? [])}
          groups={queryEndpoint.isGrouped ? queryEndpoint.groupedQuery.data?.groups : undefined}
          totalCount={totalCount}
          isLoading={
            queryEndpoint.isGrouped
              ? queryEndpoint.groupedQuery.isLoading
              : queryEndpoint.query.isLoading
          }
          page={queryEndpoint.params.page}
          pageSize={queryEndpoint.params.pageSize}
          sort={queryEndpoint.params.sort}
          onPageChange={queryEndpoint.setPage}
          onPageSizeChange={queryEndpoint.setPageSize}
          onToggleSort={queryEndpoint.toggleSort}
        />
      );
  }
}

// Workspace-scoped entity list page (`/w/:workspace/:entity`).
// 100% manifest-driven: REST base path comes from `useEntityDiscovery`,
// title / subtitle from `manifest.identity`, columns built generically
// from QueryMetadata + manifest field-widget hints. No entity-specific
// code in this file.
type TranslateFn = ReturnType<typeof useTranslation>['t'];

function renderMissingParamView(t: TranslateFn): ReactNode {
  return (
    <div data-slot="workspace-entity-page" className="space-y-2 p-6">
      <h2 className="text-2xl font-semibold">
        {t('Entity.MissingParam.Title', 'Missing entity parameter')}
      </h2>
    </div>
  );
}

function renderLoadingView(): ReactNode {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function renderManifestNotFoundView(t: TranslateFn, entity: string): ReactNode {
  return (
    <div data-slot="workspace-entity-page" className="space-y-2 p-6">
      <h2 className="text-2xl font-semibold">{t('Entity.NotFound.Title', 'Entity not found')}</h2>
      <p className="text-sm text-muted-foreground">
        {t('Entity.NotFound.Body', 'No manifest is registered for ')}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{entity}</code>.
      </p>
    </div>
  );
}

function renderNoBasePathView(t: TranslateFn): ReactNode {
  return (
    <div data-slot="workspace-entity-page" className="space-y-2 p-6">
      <h2 className="text-2xl font-semibold">
        {t('Entity.NoBasePath.Title', 'Entity is not yet routable')}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t(
          'Entity.NoBasePath.Body',
          'The discovery response does not expose a list endpoint for this entity.'
        )}
      </p>
    </div>
  );
}

function collectFieldComponents(manifest: ExtendedEntityManifest): Map<string, string> {
  const fieldComponents = new Map<string, string>();
  for (const form of manifest.forms ?? []) {
    for (const section of form.sections) {
      for (const field of section.fields) {
        if (field.component) fieldComponents.set(field.propertyName, field.component);
      }
    }
  }
  return fieldComponents;
}

export interface WorkspaceEntityPageProps {
  /** Renders entity-gallery card images — injected by the host (storage-agnostic). */
  readonly renderImage: GalleryRenderImage;
}

export function WorkspaceEntityPage({ renderImage }: WorkspaceEntityPageProps) {
  const { t } = useTranslation();
  const { workspace, entity } = useParams<{ workspace: string; entity: string }>();
  const { data: manifestRaw, isLoading, isError } = useEntityMetadata(entity ?? '');
  const { data: discovery } = useEntityDiscovery();
  const manifest = manifestRaw ? asExtended(manifestRaw) : undefined;

  if (!entity || !workspace) return renderMissingParamView(t);
  if (isLoading || !discovery) return renderLoadingView();
  if (isError || !manifest) return renderManifestNotFoundView(t, entity);

  const basePath = discovery.modules.flatMap((m) => m.items).find((it) => it.name === entity)
    ?.links.list;

  if (!basePath) return renderNoBasePathView(t);

  const fieldComponents = collectFieldComponents(manifest);

  const title = resolveLabel(
    manifest.identity?.displayKey ?? null,
    manifest.identity?.name ?? entity
  );
  const subtitle = t('Workspace.Entity.Subtitle.Default', 'Filter and explore the records.');

  // Manifest-driven layout list with a sensible default — every entity
  // has a tabular list view; alternative kinds (kanban, calendar, …)
  // come from `manifest.collections.listLayouts`. An empty list (or no
  // collections facet) collapses to the single-`List` default.
  const declared = manifest.collections?.listLayouts ?? [];
  const listLayouts: readonly EntityListLayoutManifest[] =
    declared.length > 0
      ? declared
      : [{ kind: 'List', isDefault: true, kanban: null, calendar: null, gallery: null }];

  // `<QueryEndpointStateProvider>` lifts the query-endpoint reducer
  // into context so the toolbar (SmartFilterBar / SortSelector / preset
  // toggles) and every list-alt renderer below — `<EntityList>`,
  // `<EntityGallery>`, framework `<EntityKanban>`, `<EntityCalendar>` —
  // share a single source of truth. Per the renderer matrix shipped in
  // granit-front #348: filter / search reach all renderers, sort
  // reaches list / gallery / kanban (calendar n/a), groupBy reaches
  // list only (others either layout-locked or n/a).
  return (
    <SelectionProvider>
      <QueryProvider config={{ basePath }}>
        <QueryEndpointStateProvider initialParams={{ page: 1, pageSize: 20, sort: [] }}>
          <WorkspaceEntityContent
            workspaceName={workspace}
            entityName={entity}
            title={title}
            subtitle={subtitle}
            canCreate={manifest.permissions?.canCreate ?? false}
            canUpdate={manifest.permissions?.canUpdate ?? false}
            fieldComponents={fieldComponents}
            listLayouts={listLayouts}
            manifest={manifest}
            renderImage={renderImage}
          />
        </QueryEndpointStateProvider>
      </QueryProvider>
    </SelectionProvider>
  );
}
