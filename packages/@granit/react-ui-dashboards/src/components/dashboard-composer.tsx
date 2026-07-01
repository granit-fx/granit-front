import {
  dashboardDetailToDefinition,
  diffDashboardWidgets,
  type DashboardDefinition,
  type WidgetDefinition,
} from '@granit/dashboards';
import { analyticsWidgetCatalog, validateWidgetConfig } from '@granit/react-analytics/editor';
import {
  addWidget,
  composeCatalogs,
  composeWidgetConfigFormRegistries,
  defaultWidgetCatalog,
  defaultWidgetConfigFormRegistry,
  duplicateWidget,
  EditableDashboard,
  removeWidget,
  updateWidget,
  WidgetConfigDrawer,
  WidgetPalette,
  type WidgetCatalogEntry,
} from '@granit/react-dashboard-editor';
import {
  useAddWidget,
  useDashboardDetail,
  useRemoveWidget,
  useUpdateDashboardMetadata,
  useUpdateWidget,
} from '@granit/react-dashboards';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Spinner,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from '@granit/react-ui';
import { analyticsWidgetConfigFormRegistry } from '@granit/react-ui-analytics';
import { ConfirmActionDialog } from '@granit/react-ui-kit';
import { mapWidgetCatalog, mapWidgetConfigFormRegistry } from '@granit/react-ui-map/editor';
import { ArrowLeft, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { logger } from '../logger';

type PendingEditAction = 'delete-widget' | 'discard';

/**
 * Rich, self-contained dashboard composer — the edit-mode surface shared by the
 * standalone {@link DashboardEditPage} (route `/dashboards/manage/:id/edit`) and
 * the inline edit toggle on {@link DashboardViewPage}.
 *
 * It owns the full editing pipeline:
 *
 * - **Load** — `useDashboardDetail(id)` → `dashboardDetailToDefinition` bridges
 *   the persisted-instance shape into the editor's `DashboardDefinition`.
 * - **Compose** — framework + analytics + map catalogs merged once.
 * - **Edit** — `<EditableDashboard>` (free drag-move + multi-edge resize) with
 *   an on-hover toolbar wired to edit (open the config drawer) / duplicate /
 *   delete (confirm), `<WidgetPalette>` in an Add dialog, `<WidgetConfigDrawer>`
 *   in a per-widget Edit dialog.
 * - **Save** — diff local vs server via `diffDashboardWidgets`; dispatch
 *   removed → added → updated through the per-widget CRUD hooks; metadata edits
 *   piggyback on `useUpdateDashboardMetadata`.
 *
 * Navigation is inverted to the caller via {@link onExit}: the standalone page
 * routes back to the list, the inline toggle drops back to read mode.
 */
export interface DashboardComposerProps {
  readonly dashboardId: string;
  /** Invoked by the Back/exit affordance — caller decides where "out" goes. */
  readonly onExit: () => void;
  /** Label for the exit button. Defaults to a generic "Back". */
  readonly exitLabel?: string;
  /** Root `data-slot` — keeps the standalone page's slot stable for tests/styling. */
  readonly rootSlot?: string;
}

export function DashboardComposer({
  dashboardId,
  onExit,
  exitLabel,
  rootSlot = 'dashboard-composer',
}: DashboardComposerProps) {
  const { t } = useTranslation();

  const { data: detail, isLoading } = useDashboardDetail(dashboardId);
  const updateMetadata = useUpdateDashboardMetadata();
  const addWidgetMutation = useAddWidget();
  const updateWidgetMutation = useUpdateWidget();
  const removeWidgetMutation = useRemoveWidget();

  const catalog = useMemo(
    () => composeCatalogs(defaultWidgetCatalog, analyticsWidgetCatalog, mapWidgetCatalog),
    []
  );
  const configFormRegistry = useMemo(
    () =>
      composeWidgetConfigFormRegistries(
        defaultWidgetConfigFormRegistry,
        analyticsWidgetConfigFormRegistry,
        mapWidgetConfigFormRegistry
      ),
    []
  );

  const [local, setLocal] = useState<DashboardDefinition | null>(
    detail ? dashboardDetailToDefinition(detail) : null
  );
  const [serverSnapshot, setServerSnapshot] = useState(detail);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingEditAction | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (detail !== serverSnapshot) {
    setServerSnapshot(detail);
    setLocal(detail ? dashboardDetailToDefinition(detail) : null);
    setSelectedSlug(null);
  }

  // Native event-delegation on a ref instead of a React `onClick` prop on a
  // non-interactive wrapper — keeps the wrapper inert in the React tree
  // (Sonar's a11y rules don't see the handler) while still intercepting
  // bubbled clicks from `<EditableDashboard>`'s cells. The hover toolbar +
  // drag/resize handles are excluded so their own handlers stay authoritative.
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = editorRef.current;
    if (!node) return;
    const handleCellClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest('[data-slot="sortable-widget-handle"]') ||
        target.closest('[data-slot="sortable-widget-resize-handle"]') ||
        target.closest('[data-slot="widget-action-toolbar"]')
      ) {
        return;
      }
      const cell = target.closest<HTMLElement>('[data-slot="editable-dashboard-cell"]');
      const slug = cell?.dataset['widgetSlug'] ?? null;
      if (slug) {
        setSelectedSlug(slug);
        setEditOpen(true);
      }
    };
    node.addEventListener('click', handleCellClick);
    return () => node.removeEventListener('click', handleCellClick);
  }, []);

  if (isLoading || !detail || !local) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const selectedWidget = selectedSlug
    ? local.widgets.find((w) => w.slug === selectedSlug)
    : undefined;
  const selectedWidgetErrors = selectedWidget ? validateWidgetConfig(selectedWidget) : [];

  // A widget with an empty required field renders server-side as
  // `status: 'Error'`. Gate Save on a complete config so it never ships.
  const incompleteWidgetCount = local.widgets.filter(
    (w) => validateWidgetConfig(w).length > 0
  ).length;

  const widgetDiff = diffDashboardWidgets(detail.widgets, local.widgets, detail.name);
  const widgetsDirty =
    widgetDiff.added.length + widgetDiff.updated.length + widgetDiff.removed.length > 0;
  const metadataDirty =
    local.name !== detail.name ||
    local.layout.columns !== detail.layoutColumns ||
    local.layout.rowHeight !== detail.layoutRowHeight;
  const dirty = widgetsDirty || metadataDirty;

  const handleAdd = (entry: WidgetCatalogEntry) => {
    setLocal((current) => (current ? addWidget(current, entry) : current));
    setAddOpen(false);
  };

  const handleWidgetChange = (next: WidgetDefinition) => {
    if (!selectedSlug) return;
    setLocal((current) => (current ? updateWidget(current, selectedSlug, next) : current));
  };

  const handleDeleteSelected = () => {
    if (!selectedSlug) return;
    setLocal((current) => (current ? removeWidget(current, selectedSlug) : current));
    setSelectedSlug(null);
    setEditOpen(false);
  };

  const handleReset = () => {
    setLocal(dashboardDetailToDefinition(detail));
    setSelectedSlug(null);
    setEditOpen(false);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (metadataDirty) {
        await updateMetadata.mutateAsync({
          id: dashboardId,
          request: {
            name: local.name,
            layoutColumns: local.layout.columns,
            layoutRowHeight: local.layout.rowHeight,
          },
        });
      }
      // Removed → added → updated. Removing first frees position slots;
      // adding next mints fresh ids; updating last persists final state.
      for (const op of widgetDiff.removed) {
        await removeWidgetMutation.mutateAsync({ dashboardId, widgetId: op.widgetId });
      }
      for (const op of widgetDiff.added) {
        await addWidgetMutation.mutateAsync({ dashboardId, request: op.request });
      }
      for (const op of widgetDiff.updated) {
        await updateWidgetMutation.mutateAsync({
          dashboardId,
          widgetId: op.widgetId,
          request: op.request,
        });
      }
      toast.success(t('Dashboards.Edit.SaveSuccess', { defaultValue: 'Dashboard saved' }));
    } catch (error) {
      // User-facing API errors are surfaced by the global MutationCache.onError
      // toast; log here for diagnostics so the failure isn't swallowed silently.
      logger.error('Failed to persist dashboard edits', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-slot={rootSlot} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onExit}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {exitLabel ?? t('Common.Back', { defaultValue: 'Back' })}
          </Button>
          <div>
            <input
              data-slot="dashboard-name-input"
              value={local.name}
              onChange={(event) =>
                setLocal((current) =>
                  current ? { ...current, name: event.target.value } : current
                )
              }
              className="border-0 bg-transparent text-2xl font-semibold text-foreground focus:outline-none"
            />
            <p className="text-xs text-muted-foreground">
              <span
                data-slot="dashboard-status-badge"
                className="rounded-sm bg-muted px-1.5 py-0.5 uppercase tracking-wide"
              >
                {detail.status}
              </span>
              {' · '}
              {detail.category}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-slot="dashboard-edit-add-trigger"
            variant="outline"
            size="sm"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('Dashboards.Edit.AddWidget', { defaultValue: 'Add widget' })}
          </Button>
          {dirty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPendingAction('discard')}
              disabled={saving}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('Common.Discard', { defaultValue: 'Discard' })}
            </Button>
          )}
          {incompleteWidgetCount > 0 && (
            <span data-slot="dashboard-edit-incomplete-hint" className="text-xs text-destructive">
              {t('Dashboards.Edit.IncompleteWidgets', {
                count: incompleteWidgetCount,
                defaultValue_one: '{{count}} widget needs required fields',
                defaultValue_other: '{{count}} widgets need required fields',
              })}
            </span>
          )}
          <Button
            size="sm"
            disabled={!dirty || saving || incompleteWidgetCount > 0}
            onClick={handleSave}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving
              ? t('Common.Saving', { defaultValue: 'Saving…' })
              : t('Common.Save', { defaultValue: 'Save' })}
          </Button>
        </div>
      </div>

      <div ref={editorRef}>
        <EditableDashboard
          definition={local}
          onChange={setLocal}
          catalog={catalog}
          onEditWidget={(slug) => {
            setSelectedSlug(slug);
            setEditOpen(true);
          }}
          onDuplicateWidget={(slug) =>
            setLocal((current) => (current ? duplicateWidget(current, slug) : current))
          }
          onDeleteWidget={(slug) => {
            setSelectedSlug(slug);
            setPendingAction('delete-widget');
          }}
        />
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent data-slot="dashboard-add-widget-dialog">
          <DialogHeader>
            <DialogTitle>
              {t('Dashboards.Edit.AddWidget.Title', { defaultValue: 'Add a widget' })}
            </DialogTitle>
            <DialogDescription>
              {t('Dashboards.Edit.AddWidget.Body', {
                defaultValue:
                  'Pick a widget type to drop on the dashboard. You can configure it after it lands on the grid.',
              })}
            </DialogDescription>
          </DialogHeader>
          <WidgetPalette
            catalog={catalog}
            onAdd={handleAdd}
            className="grid grid-cols-2 gap-2 sm:grid-cols-3"
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setSelectedSlug(null);
        }}
      >
        <DialogContent
          data-slot="dashboard-edit-widget-dialog"
          data-widget-slug={selectedWidget?.slug}
        >
          {selectedWidget ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t('Dashboards.Edit.EditWidget.Title', {
                    slug: selectedWidget.slug,
                    defaultValue: 'Edit widget — {{slug}}',
                  })}
                </DialogTitle>
              </DialogHeader>
              <WidgetConfigDrawer
                widget={selectedWidget}
                onChange={handleWidgetChange}
                registry={configFormRegistry}
              />
              {selectedWidgetErrors.length > 0 && (
                <p data-slot="widget-config-missing-required" className="text-xs text-destructive">
                  {t('Dashboards.Edit.MissingRequired', { defaultValue: 'Required:' })}{' '}
                  {selectedWidgetErrors.map((error) => t(error.labelKey)).join(', ')}
                </p>
              )}
              <DialogFooter className="sm:justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setPendingAction('delete-widget')}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('Common.Remove', { defaultValue: 'Remove' })}
                </Button>
                <DialogClose asChild>
                  <Button size="sm">{t('Common.Done', { defaultValue: 'Done' })}</Button>
                </DialogClose>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={pendingAction === 'delete-widget' && selectedWidget !== undefined}
        onOpenChange={(open) => !open && setPendingAction(null)}
        data-slot="dashboard-edit-confirm"
        tone="destructive"
        title={t('Dashboards.Edit.Confirm.RemoveWidget.Title', {
          defaultValue: 'Remove widget?',
        })}
        description={t('Dashboards.Edit.Confirm.RemoveWidget.Body', {
          slug: selectedWidget?.slug,
          defaultValue:
            '“{{slug}}” will be removed from the working copy. The deletion persists when you save.',
        })}
        confirmLabel={t('Common.Remove', { defaultValue: 'Remove' })}
        cancelLabel={t('Common.Cancel', { defaultValue: 'Cancel' })}
        onConfirm={() => {
          handleDeleteSelected();
          setPendingAction(null);
        }}
      />
      <ConfirmActionDialog
        open={pendingAction === 'discard'}
        onOpenChange={(open) => !open && setPendingAction(null)}
        data-slot="dashboard-edit-confirm"
        tone="destructive"
        title={t('Dashboards.Edit.Confirm.Discard.Title', {
          defaultValue: 'Discard unsaved changes?',
        })}
        description={t('Dashboards.Edit.Confirm.Discard.Body', {
          defaultValue:
            'Local edits will be reverted to the last saved version. This cannot be undone.',
        })}
        confirmLabel={t('Common.Discard', { defaultValue: 'Discard' })}
        cancelLabel={t('Common.KeepEditing', { defaultValue: 'Keep editing' })}
        onConfirm={() => {
          handleReset();
          setPendingAction(null);
        }}
      />
    </div>
  );
}
