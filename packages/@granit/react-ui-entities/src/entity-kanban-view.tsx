import { buildQueryKey } from '@granit/query-engine';
import {
  useEntityActionDispatcher,
  useUpdateEntity,
  type EntityActionHandlers,
} from '@granit/react-entities';
import { resolveLabel, useDateFormatter, useTranslation } from '@granit/react-localization';
import { formatCell, useQueryConfig } from '@granit/react-query-engine';
import { Button, toast } from '@granit/react-ui';
import { cn } from '@granit/utils';
import {
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  PanelRightOpen,
  Play,
  SquarePen,
  Trash2,
} from 'lucide-react';
import { useCallback, useMemo, useState, type DragEvent } from 'react';

import { logger } from './logger';

import type { ExtendedEntityManifest } from './manifest-extensions';
import type {
  EntityActionManifest,
  EntityFormFieldManifest,
  EntityKanbanCardActionManifest,
  EntityKanbanColumnManifest,
  EntityKanbanLayoutManifest,
  KanbanColor,
  KanbanColumnState,
} from '@granit/entities';
import type { ColumnDefinition } from '@granit/query-engine';

// KanbanColor → token-only class set. Raw Tailwind colours stay
// forbidden outside `src/components/ui/`, so we collapse the framework
// palette onto a small set of semantic-token tints. Several colours
// share a token deliberately — the colour value still surfaces as a
// `data-color` attribute so apps can layer their own theme later.
const COLUMN_COLOR_CLASS: Readonly<Record<KanbanColor, string>> = {
  Neutral: 'border-border bg-muted/40',
  Gray: 'border-border bg-muted/40',
  Blue: 'border-primary/40 bg-primary/10',
  Green: 'border-accent/50 bg-accent/30',
  Red: 'border-destructive/40 bg-destructive/10',
  Orange: 'border-secondary/50 bg-secondary',
  Yellow: 'border-secondary/50 bg-secondary',
  Purple: 'border-secondary/50 bg-secondary',
  Cyan: 'border-primary/30 bg-primary/5',
};

const FALLBACK_COLUMN_CLASS = 'border-border bg-muted/40';

function camelize(propertyName: string): string {
  if (!propertyName) return propertyName;
  return propertyName.charAt(0).toLowerCase() + propertyName.slice(1);
}

// Coerce unknown values to a string without leaking "[object Object]" for
// object/array shapes — used by row-id and group-key lookups where the
// manifest's property type is opaque at runtime.
function toScalarString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

interface ColumnBucket {
  readonly column: EntityKanbanColumnManifest;
  readonly items: readonly Readonly<Record<string, unknown>>[];
}

function bucketRows(
  rows: readonly Readonly<Record<string, unknown>>[],
  groupByJsonKey: string,
  declaredColumns: readonly EntityKanbanColumnManifest[]
): readonly ColumnBucket[] {
  // Index declared columns by `value` so we keep their order and metadata
  // (colour + initial state). Rows whose value isn't in the catalogue land
  // in a synthesised column with no colour — same fallback the framework's
  // `bucketByField` uses, but we preserve declared metadata when matched.
  const byValue = new Map<string, Readonly<Record<string, unknown>>[]>();
  for (const col of declaredColumns) byValue.set(col.value, []);

  const extra = new Map<string, Readonly<Record<string, unknown>>[]>();
  for (const row of rows) {
    const raw = row[groupByJsonKey];
    const key = toScalarString(raw, '∅');
    const bucket = byValue.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      let other = extra.get(key);
      if (!other) {
        other = [];
        extra.set(key, other);
      }
      other.push(row);
    }
  }

  const declared = declaredColumns.map((column) => ({
    column,
    items: byValue.get(column.value) ?? [],
  }));
  const synthesised = Array.from(extra, ([key, items]) => ({
    column: { value: key, color: null, defaultState: 'Open' as KanbanColumnState },
    items,
  }));
  return [...declared, ...synthesised];
}

export interface EntityKanbanViewProps {
  /** Wire identifier of the entity (e.g. `"Granit.Invoicing.Invoice"`). */
  readonly entityName: string;
  /** Full manifest — drives action lookup. */
  readonly manifest: ExtendedEntityManifest;
  /** Kanban layout pulled from `manifest.collections.listLayouts[].kanban`. */
  readonly layout: EntityKanbanLayoutManifest;
  /** Rows fetched by the parent's `useQueryEndpoint` (filter-aware). */
  readonly rows: readonly Readonly<Record<string, unknown>>[];
  /** Whether the user can mutate rows (drives DnD availability). */
  readonly canUpdate: boolean;
  /** UI locale (for date / number formatting). */
  readonly locale: string;
  /** Optional card activation handler — receives the row id. */
  readonly onCardClick?: (id: string) => void;
  /**
   * Per-kind handler overrides forwarded to the entity action dispatcher
   * so kanban-card `Navigate` actions stay in-app via React Router
   * instead of the framework default (`globalThis.location.href`).
   */
  readonly actionHandlers?: EntityActionHandlers;
}

// Generic kanban renderer mounted by `<WorkspaceEntityPage>` when the
// active list layout is `Kanban`. Consumes the full
// `EntityKanbanLayoutManifest` schema (title + body fields + relations
// + actions, columns with `KanbanColor` + `KanbanColumnState`) and
// surfaces drag-and-drop column transitions when
// `manifest.permissions.canUpdate` is true.
//
// Stays 100% manifest-driven — no per-entity branches. The framework's
// `<EntityKanban />` is deliberately read-only and ignores card body
// fields / actions; we paint our own DOM here so the cards carry the
// declared schema and the drop handlers wire to the entity REST
// endpoint.
export function EntityKanbanView({
  entityName,
  manifest,
  layout,
  rows,
  canUpdate,
  locale,
  onCardClick,
  actionHandlers,
}: EntityKanbanViewProps) {
  const { t } = useTranslation();
  const queryConfig = useQueryConfig();

  const groupByJsonKey = useMemo(
    () => camelize(layout.groupByPropertyName),
    [layout.groupByPropertyName]
  );
  const displayProperty = manifest.identity?.displayProperty ?? null;
  const titleJsonKey = useMemo(() => {
    if (layout.card.titleProperty) return camelize(layout.card.titleProperty);
    if (displayProperty) return camelize(displayProperty);
    return 'name';
  }, [layout.card.titleProperty, displayProperty]);

  // Resolve `card.actions[]` (compact name-only refs) against the full
  // manifest's `actions[]` (with endpoint / kind / etc.). Skip silently
  // if a referenced action isn't declared on the entity.
  const cardActions = useMemo(() => {
    const all = manifest.actions ?? [];
    const byName = new Map(all.map((a) => [a.name, a]));
    return layout.card.actions
      .map((ref) => ({ ref, action: byName.get(ref.name) }))
      .filter(
        (entry): entry is { ref: EntityKanbanCardActionManifest; action: EntityActionManifest } =>
          Boolean(entry.action)
      );
  }, [layout.card.actions, manifest.actions]);

  const buckets = useMemo(
    () => bucketRows(rows, groupByJsonKey, layout.columns),
    [rows, groupByJsonKey, layout.columns]
  );
  // Drop the `Hidden` columns — `KanbanColumnState.Hidden` keeps the
  // column off the board entirely.
  const visibleBuckets = useMemo(
    () => buckets.filter((b) => b.column.defaultState !== 'Hidden'),
    [buckets]
  );

  const [collapsedColumns, setCollapsedColumns] = useState<ReadonlySet<string>>(
    () => new Set(layout.columns.filter((c) => c.defaultState === 'Collapsed').map((c) => c.value))
  );

  const toggleColumn = useCallback(
    (value: string) =>
      setCollapsedColumns((prev) => {
        const next = new Set(prev);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        return next;
      }),
    []
  );

  // `PATCH {basePath}/{id}` of the group-by column, with optimistic
  // list-cache patching + rollback folded into the shared hook. The
  // kanban reads its rows from the query-engine `list` cache, so it
  // hands the hook that list key and per-row patcher and asks it to
  // invalidate the same key on settle.
  const listKey = buildQueryKey(queryConfig, 'list');
  const transition = useUpdateEntity(entityName, {
    basePath: queryConfig.basePath,
    invalidateOnSettle: [listKey],
  });

  const handleDrop = useCallback(
    (newValue: string) => (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      if (!id) return;
      const row = rows.find((r) => toScalarString(r.id ?? r.Id) === id);
      const current = row ? toScalarString(row[groupByJsonKey]) : '';
      if (current === newValue) return;
      transition.mutate({
        id,
        values: { [groupByJsonKey]: newValue },
        optimistic: {
          listKey,
          patchRow: (r) =>
            toScalarString(r.id ?? r.Id) === id ? { ...r, [groupByJsonKey]: newValue } : r,
        },
      });
    },
    [rows, groupByJsonKey, transition, listKey]
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLElement>) => {
      if (!canUpdate) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },
    [canUpdate]
  );

  return (
    <div
      data-slot="entity-kanban-view"
      data-entity={entityName}
      data-can-update={canUpdate || undefined}
      data-group-by={layout.groupByPropertyName}
      className="flex gap-3 overflow-x-auto rounded-md border border-border bg-card p-3"
    >
      {visibleBuckets.map(({ column, items }) => {
        const colorClass = column.color
          ? (COLUMN_COLOR_CLASS[column.color] ?? FALLBACK_COLUMN_CLASS)
          : FALLBACK_COLUMN_CLASS;
        const isCollapsed = collapsedColumns.has(column.value);

        return (
          // Kanban column = drop target. Drag-and-drop is pointer-driven by
          // design; AT users use the per-card action menu rather than DnD.
          // NOSONAR(jsx-a11y/no-static-element-interactions)
          <section
            key={column.value}
            data-slot="kanban-column"
            data-column-value={column.value}
            data-color={column.color ?? undefined}
            data-collapsed={isCollapsed || undefined}
            aria-label={column.value}
            onDragOver={handleDragOver}
            onDrop={canUpdate ? handleDrop(column.value) : undefined}
            className={cn(
              'flex flex-shrink-0 flex-col rounded-md border transition-colors',
              colorClass,
              isCollapsed ? 'w-12' : 'w-72 gap-2 p-3'
            )}
          >
            {isCollapsed ? (
              // Collapsed state: the entire column body acts as the toggle
              // target. Chevron at the top, count below, vertical title — keeps
              // the click-to-reopen surface big enough on a narrow column
              // (the previous "header button" got squeezed off the row by the
              // count badge).
              <button
                type="button"
                onClick={() => toggleColumn(column.value)}
                aria-expanded={false}
                aria-label={t('Entity.Kanban.ExpandColumn', 'Expand column')}
                className="flex h-full flex-col items-center justify-start gap-2 p-2 text-xs font-semibold text-foreground hover:bg-foreground/5"
              >
                <ChevronRight className="size-4" />
                <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {items.length}
                </span>
                <span className="mt-1 [writing-mode:vertical-rl] [transform:rotate(180deg)] truncate">
                  {column.value}
                </span>
              </button>
            ) : (
              <>
                <header
                  data-slot="kanban-column-header"
                  className="flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={() => toggleColumn(column.value)}
                    aria-expanded
                    aria-label={t('Entity.Kanban.CollapseColumn', 'Collapse column')}
                    className="flex flex-1 items-center gap-2 truncate text-sm font-semibold text-foreground"
                  >
                    <ChevronDown className="size-4 flex-shrink-0" />
                    <span className="truncate">{column.value}</span>
                  </button>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {items.length}
                  </span>
                </header>

                <ul data-slot="kanban-cards" className="flex flex-col gap-2">
                  {items.map((row, idx) => (
                    <KanbanCard
                      key={toScalarString(row.id ?? row.Id, String(idx))}
                      row={row}
                      titleJsonKey={titleJsonKey}
                      fields={layout.card.fields}
                      actions={cardActions}
                      canDrag={canUpdate}
                      locale={locale}
                      onClick={onCardClick}
                      actionHandlers={actionHandlers}
                    />
                  ))}
                </ul>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}

interface KanbanCardProps {
  readonly row: Readonly<Record<string, unknown>>;
  readonly titleJsonKey: string;
  readonly fields: readonly EntityFormFieldManifest[];
  readonly actions: readonly {
    readonly ref: EntityKanbanCardActionManifest;
    readonly action: EntityActionManifest;
  }[];
  readonly canDrag: boolean;
  readonly locale: string;
  readonly onClick: ((id: string) => void) | undefined;
  readonly actionHandlers: EntityActionHandlers | undefined;
}

function KanbanCard({
  row,
  titleJsonKey,
  fields,
  actions,
  canDrag,
  locale,
  onClick,
  actionHandlers,
}: KanbanCardProps) {
  const id = toScalarString(row.id ?? row.Id);
  const title = formatTitle(row[titleJsonKey]) ?? id;

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLLIElement>) => {
      if (!canDrag) return;
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.effectAllowed = 'move';
    },
    [canDrag, id]
  );

  const clickable = Boolean(onClick && id);
  const handleClick = clickable ? () => onClick?.(id) : undefined;

  const fieldsBlock =
    fields.length > 0 ? (
      <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
        {fields.map((field) => (
          <KanbanCardField key={field.propertyName} field={field} row={row} locale={locale} />
        ))}
      </dl>
    ) : null;

  // The card body (title + manifest fields) becomes a real `<button>`
  // when clickable so Enter/Space + focus management come from the
  // platform. Per-row action buttons sit as siblings — never nested in
  // a button — so HTML stays valid and Sonar's
  // `no-noninteractive-element-interactions` rule stays quiet on the
  // outer `<li>` (which only carries drag handlers).
  const body = clickable ? (
    <button
      type="button"
      onClick={handleClick}
      data-slot="kanban-card-body"
      className="flex w-full flex-col gap-1 appearance-none border-0 bg-transparent p-0 text-left text-inherit cursor-pointer hover:opacity-95"
    >
      <span className="truncate font-medium text-foreground">{title}</span>
      {fieldsBlock}
    </button>
  ) : (
    <>
      <span className="truncate font-medium text-foreground">{title}</span>
      {fieldsBlock}
    </>
  );

  return (
    <li
      data-slot="kanban-card"
      data-card-id={id}
      draggable={canDrag}
      onDragStart={handleDragStart}
      className={cn(
        'flex flex-col gap-1 rounded-sm border border-border bg-background p-3 text-sm shadow-sm transition-colors',
        clickable && 'hover:bg-accent',
        canDrag && 'cursor-grab active:cursor-grabbing'
      )}
    >
      {actions.length > 0 ? (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">{body}</div>
          <div className="flex flex-shrink-0 items-center gap-1">
            {actions.map(({ ref, action }) => (
              <KanbanCardActionButton
                key={action.name}
                action={action}
                ref_={ref}
                entityId={id}
                row={row}
                actionHandlers={actionHandlers}
              />
            ))}
          </div>
        </div>
      ) : (
        body
      )}
    </li>
  );
}

interface KanbanCardFieldProps {
  readonly field: EntityFormFieldManifest;
  readonly row: Readonly<Record<string, unknown>>;
  readonly locale: string;
}

function KanbanCardField({ field, row, locale }: KanbanCardFieldProps) {
  const { formatDate, formatDateTime } = useDateFormatter();
  const formatted = formatCell({
    row,
    column: fieldToColumnDefinition(field),
    component: field.component,
    currencyResolver: makeCurrencyResolver(field),
    locale,
    formatDate,
    formatDateTime,
  });
  return (
    <>
      <dt className="text-muted-foreground">{resolveLabel(field.labelKey, field.propertyName)}</dt>
      <dd className="truncate text-foreground">{formatted}</dd>
    </>
  );
}

// Adapts a form-field manifest to the ColumnDefinition shape the shared
// `formatCell` consumes, so kanban cards format field values exactly like the
// query grids (Url/Email/Phone links, Percentage, dates, …). A `money` field
// carries its amount in Int64 minor units (cents), formatted through the
// `component: 'money'` path below — so its `valueKind` (major-units Currency)
// is suppressed to avoid a ×100 mismatch.
export function fieldToColumnDefinition(field: EntityFormFieldManifest): ColumnDefinition {
  return {
    name: camelize(field.propertyName),
    label: field.labelKey ?? field.propertyName,
    type: field.clrTypeName,
    order: field.order,
    isSortable: false,
    isFilterable: false,
    isVisible: true,
    valueKind: field.component === 'money' ? undefined : (field.valueKind ?? undefined),
  };
}

// Currency resolver for the legacy `money` component: prefers the field's
// configured `currencyProperty`, then a row-level `currency`, then EUR.
export function makeCurrencyResolver(
  field: EntityFormFieldManifest
): (row: Readonly<Record<string, unknown>>) => string {
  const config = (field.config ?? {}) as { readonly currencyProperty?: string };
  const currencyProperty = config.currencyProperty ? camelize(config.currencyProperty) : undefined;
  return (row) =>
    (currencyProperty ? (row[currencyProperty] as string | undefined) : undefined) ??
    (row.currency as string | undefined) ??
    'EUR';
}

interface KanbanCardActionButtonProps {
  readonly action: EntityActionManifest;
  readonly ref_: EntityKanbanCardActionManifest;
  readonly entityId: string;
  readonly row: Readonly<Record<string, unknown>>;
  readonly actionHandlers?: EntityActionHandlers;
}

// Compact icon-only action button for kanban cards. Delegates to the
// canonical entity-action dispatcher from `@granit/react-entities`
// (download / ApiCall / Navigate / WorkflowTransition) and renders a
// small icon-button styled with shadcn `<Button>` so the card stays
// dense. The dispatcher's defaults handle `Download` / `ApiCall`;
// `Navigate` is overridden via `actionHandlers` to stay in-app.
function KanbanCardActionButton({
  action,
  ref_,
  entityId,
  row,
  actionHandlers,
}: KanbanCardActionButtonProps) {
  const { t } = useTranslation();
  const dispatch = useEntityActionDispatcher(actionHandlers);
  const [pending, setPending] = useState(false);
  const label = resolveLabel(ref_.displayKey ?? action.displayKey, action.name);

  const handleClick = async (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      await dispatch(action, entityId, row);
    } catch (error: unknown) {
      // The action dispatcher makes direct API calls (not React Query), so the
      // global MutationCache.onError toast does not fire — surface the error here.
      logger.error(`[KanbanCardAction] "${action.name}" failed`, error);
      toast.error(t('Entity.Action.Failed', 'Action failed'));
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={label}
      title={label}
      onClick={handleClick}
      disabled={pending}
      className="h-7 w-7 p-0"
      data-slot="kanban-card-action"
      data-action-name={action.name}
      data-action-kind={action.kind}
    >
      {renderActionIcon(action)}
    </Button>
  );
}

function renderActionIcon(action: EntityActionManifest) {
  const className = 'size-3.5';
  switch (action.kind) {
    case 'Download':
      return <Download className={className} />;
    case 'Navigate':
      return <ExternalLink className={className} />;
    case 'WorkflowTransition':
      return <Play className={className} />;
    case 'OpenDrawer':
      return <PanelRightOpen className={className} />;
    case 'OpenModal':
      return <SquarePen className={className} />;
    case 'ApiCall':
      return action.confirmationKey ? (
        <Trash2 className={className} />
      ) : (
        <Play className={className} />
      );
  }
}

function formatTitle(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return null;
  return String(value); // NOSONAR: remaining types (symbol, function) stringify safely
}
