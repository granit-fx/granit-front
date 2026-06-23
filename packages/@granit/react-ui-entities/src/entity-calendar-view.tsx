import {
  EntityActionButton,
  resolveAction,
  useEntityActionDispatcher,
  useEntityCalendar,
  type EntityActionHandlers,
} from '@granit/react-entities';
import { useTimezone, useTranslation } from '@granit/react-localization';
import { Button, Switch } from '@granit/react-ui';
import { cn } from '@granit/utils';
import {
  addDays,
  addMonths,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { ExtendedEntityManifest } from './manifest-extensions';
import type {
  CalendarItemResponse,
  EntityActionManifest,
  EntityCalendarLayoutManifest,
} from '@granit/entities';

export type CalendarViewMode = 'day' | 'week' | 'month' | 'year';

export interface EntityCalendarViewProps {
  /** Wire identifier of the entity (e.g. `"Granit.Invoicing.Invoice"`). */
  readonly entityName: string;
  /**
   * Full entity manifest — used to resolve `layout.actions` compact refs
   * to their full `EntityActionManifest` descriptors when rendering tile
   * action buttons.
   */
  readonly manifest: ExtendedEntityManifest;
  /** Calendar layout pulled from `manifest.collections.listLayouts[].calendar`. */
  readonly layout: EntityCalendarLayoutManifest;
  /** Optional event activation handler — receives the row id. */
  readonly onItemClick?: (id: string) => void;
  /**
   * Per-kind handler overrides forwarded to the entity action dispatcher
   * so tile `Navigate` actions stay in-app via React Router instead of
   * the framework default (`globalThis.location.href`).
   */
  readonly actionHandlers?: EntityActionHandlers;
}

const VIEW_MODES: readonly CalendarViewMode[] = ['day', 'week', 'month', 'year'] as const;

// Week starts on Monday — Odoo / Granit convention. A future iteration
// can read this from the user's locale via `formatDateTime` once we surface it.
const WEEK_STARTS_ON = 1;

// Deterministic colour-bucket palette. The `event.color` string is opaque
// (projected from the entity's `colorByPropertyName`); we hash it into a
// small set of semantic-token tints so the visual stays inside the design
// system's token scope (per `granit-front/docs/design-system-rules.md`,
// raw Tailwind colours are forbidden outside `src/components/ui/`).
const COLOR_PALETTE = [
  'bg-primary/10 text-primary border-primary/30',
  'bg-secondary text-secondary-foreground border-border',
  'bg-accent text-accent-foreground border-border',
  'bg-muted text-foreground border-border',
  'bg-popover text-popover-foreground border-border',
  'bg-card text-card-foreground border-border',
] as const;

function hashColor(seed: string | null): string {
  if (!seed) return COLOR_PALETTE[1];
  let acc = 0;
  for (let i = 0; i < seed.length; i += 1) acc = Math.trunc(acc * 31 + (seed.codePointAt(i) ?? 0));
  return COLOR_PALETTE[Math.abs(acc) % COLOR_PALETTE.length]!;
}

interface VisibleRange {
  /** Inclusive lower bound (start of first cell). */
  readonly from: Date;
  /** Exclusive-ish upper bound (end of last cell, last ms). */
  readonly to: Date;
}

function visibleRange(mode: CalendarViewMode, cursor: Date): VisibleRange {
  switch (mode) {
    case 'day':
      return { from: startOfDay(cursor), to: endOfDay(cursor) };
    case 'week':
      return {
        from: startOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON }),
        to: endOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON }),
      };
    case 'month': {
      const monthStart = startOfMonth(cursor);
      const monthEnd = endOfMonth(cursor);
      return {
        from: startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON }),
        to: endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON }),
      };
    }
    case 'year':
      return { from: startOfYear(cursor), to: endOfYear(cursor) };
  }
}

// Generic calendar layout body mounted by `<WorkspaceEntityPage>` when
// the active list layout is `Calendar`. Owns the visible window state
// (cursor + view mode + show-weekends) and renders an Odoo-style
// calendar grid.
//
// Stays 100% manifest-driven — no per-entity branches. Every entity
// declaring a `Calendar` layout in `manifest.collections.listLayouts`
// surfaces the same toolbar + grid; only the projected
// `startPropertyName` / `titlePropertyName` / `colorByPropertyName`
// from the manifest decides what each event tile represents.
//
// The framework's `<EntityCalendar />` ships a deliberately neutral
// agenda scaffold; for the calendar view we bypass it and call
// `useEntityCalendar` directly so the grid layout is host-owned.
export function EntityCalendarView({
  entityName,
  manifest,
  layout,
  onItemClick,
  actionHandlers,
}: EntityCalendarViewProps) {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<CalendarViewMode>('month');
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [showWeekends, setShowWeekends] = useState<boolean>(true);

  // Resolve compact tile-action refs against the full manifest's
  // `actions` facet — the framework's `<EntityCalendar>` does the
  // same internally, but this view paints its own grid (Odoo-style),
  // so we wire the resolution + dispatch ourselves. `tileActions` /
  // `dispatch` are forwarded into `renderGrid` and used by `EventChip`
  // to surface inline action icon-buttons next to each event.
  const dispatch = useEntityActionDispatcher(actionHandlers);
  const tileActions = useMemo<readonly EntityActionManifest[]>(() => {
    if (!layout.actions || layout.actions.length === 0) return [];
    const resolved: EntityActionManifest[] = [];
    for (const ref of layout.actions) {
      const action = resolveAction(
        ref,
        (manifest.actions as readonly EntityActionManifest[] | undefined) ?? null
      );
      if (action) resolved.push(action);
    }
    return resolved;
  }, [layout.actions, manifest.actions]);

  const range = useMemo(() => visibleRange(mode, cursor), [mode, cursor]);
  const rangeIso = useMemo(
    () => ({ from: range.from.toISOString(), to: range.to.toISOString() }),
    [range.from, range.to]
  );

  const query = useEntityCalendar(entityName, rangeIso.from, rangeIso.to);
  const items = useMemo(() => query.data ?? [], [query.data]);

  const periodLabel = useMemo(() => {
    const formatter = (opts: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(i18n.language, opts);
    switch (mode) {
      case 'day':
        return formatter({ dateStyle: 'full' }).format(cursor);
      case 'week': {
        const start = startOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON });
        const end = endOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON });
        const fmtDay = formatter({ day: 'numeric', month: 'short' });
        const fmtYear = formatter({ year: 'numeric' });
        return `${fmtDay.format(start)} – ${fmtDay.format(end)} ${fmtYear.format(end)}`;
      }
      case 'month':
        return formatter({ year: 'numeric', month: 'long' }).format(cursor);
      case 'year':
        return formatter({ year: 'numeric' }).format(cursor);
    }
  }, [mode, cursor, i18n.language]);

  const handlePrev = useCallback(
    () =>
      setCursor((c) => {
        switch (mode) {
          case 'day':
            return addDays(c, -1);
          case 'week':
            return addDays(c, -7);
          case 'month':
            return addMonths(c, -1);
          case 'year':
            return addYears(c, -1);
        }
      }),
    [mode]
  );

  const handleNext = useCallback(
    () =>
      setCursor((c) => {
        switch (mode) {
          case 'day':
            return addDays(c, 1);
          case 'week':
            return addDays(c, 7);
          case 'month':
            return addMonths(c, 1);
          case 'year':
            return addYears(c, 1);
        }
      }),
    [mode]
  );

  const handleToday = useCallback(() => setCursor(new Date()), []);

  return (
    <div data-slot="entity-calendar-view" className="flex flex-col gap-4">
      <CalendarToolbar
        periodLabel={periodLabel}
        mode={mode}
        showWeekends={showWeekends}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onModeChange={setMode}
        onShowWeekendsChange={setShowWeekends}
      />

      <div
        data-slot="entity-calendar-grid"
        data-mode={mode}
        data-show-weekends={showWeekends || undefined}
        data-loading={query.isLoading || undefined}
        data-error={query.isError || undefined}
        data-start-property={layout.startPropertyName}
        data-end-property={layout.endPropertyName ?? undefined}
        data-color-property={layout.colorByPropertyName ?? undefined}
        className={cn(
          'rounded-md border border-border bg-card',
          query.isLoading && 'opacity-60',
          query.isError && 'border-destructive/40'
        )}
      >
        {query.isError ? (
          <div role="alert" className="p-6 text-sm text-destructive">
            {t('Entity.Calendar.LoadError', 'Failed to load events.')}
          </div>
        ) : (
          renderGrid({
            mode,
            cursor,
            showWeekends,
            items,
            locale: i18n.language,
            onItemClick,
            t,
            tileActions,
            dispatch,
          })
        )}
      </div>
    </div>
  );
}

interface CalendarToolbarProps {
  readonly periodLabel: string;
  readonly mode: CalendarViewMode;
  readonly showWeekends: boolean;
  readonly onPrev: () => void;
  readonly onNext: () => void;
  readonly onToday: () => void;
  readonly onModeChange: (mode: CalendarViewMode) => void;
  readonly onShowWeekendsChange: (value: boolean) => void;
}

function CalendarToolbar({
  periodLabel,
  mode,
  showWeekends,
  onPrev,
  onNext,
  onToday,
  onModeChange,
  onShowWeekendsChange,
}: CalendarToolbarProps) {
  const { t } = useTranslation();
  return (
    <div
      data-slot="entity-calendar-toolbar"
      className="flex flex-wrap items-center gap-3"
      role="toolbar"
      aria-label={t('Entity.Calendar.Toolbar', 'Calendar controls')}
    >
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          aria-label={t('Entity.Calendar.Prev', 'Previous')}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToday}>
          {t('Entity.Calendar.Today', 'Today')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          aria-label={t('Entity.Calendar.Next', 'Next')}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <span className="text-sm font-medium text-foreground" aria-live="polite">
        {periodLabel}
      </span>

      <div
        role="tablist"
        aria-label={t('Entity.Calendar.ViewMode', 'View mode')}
        className="ml-auto inline-flex rounded-md border border-border bg-background p-0.5"
      >
        {VIEW_MODES.map((m) => {
          const isActive = m === mode;
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-active={isActive || undefined}
              onClick={() => onModeChange(m)}
              className={cn(
                'rounded-sm px-3 py-1 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t(`Entity.Calendar.Mode.${capitalize(m)}`, capitalize(m))}
            </button>
          );
        })}
      </div>

      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Switch
          checked={showWeekends}
          onCheckedChange={onShowWeekendsChange}
          aria-label={t('Entity.Calendar.ShowWeekends', 'Show weekends')}
        />
        <span>{t('Entity.Calendar.ShowWeekends', 'Show weekends')}</span>
      </label>
    </div>
  );
}

function capitalize<T extends string>(value: T): Capitalize<T> {
  return (value.charAt(0).toUpperCase() + value.slice(1)) as Capitalize<T>;
}

interface RenderGridArgs {
  readonly mode: CalendarViewMode;
  readonly cursor: Date;
  readonly showWeekends: boolean;
  readonly items: readonly CalendarItemResponse[];
  readonly locale: string;
  readonly onItemClick: ((id: string) => void) | undefined;
  readonly t: ReturnType<typeof useTranslation>['t'];
  readonly tileActions: readonly EntityActionManifest[];
  readonly dispatch: ReturnType<typeof useEntityActionDispatcher>;
}

// Per-view props — `RenderGridArgs` is the union of everything `renderGrid`
// dispatches over. Each sub-view narrows that to what it actually consumes
// so static analysis can spot truly unused props (and Sonar's react/prop-types
// rule stops yelling about the rest).
type DayViewProps = Omit<RenderGridArgs, 'mode' | 'showWeekends'>;
type WeekViewProps = Omit<RenderGridArgs, 'mode'>;
type MonthViewProps = Omit<RenderGridArgs, 'mode'>;
type YearViewProps = Pick<RenderGridArgs, 'cursor' | 'showWeekends' | 'items' | 'locale'>;

function renderGrid(args: RenderGridArgs) {
  switch (args.mode) {
    case 'day':
      return <DayView {...args} />;
    case 'week':
      return <WeekView {...args} />;
    case 'month':
      return <MonthView {...args} />;
    case 'year':
      return <YearView {...args} />;
  }
}

function eventsOnDay(items: readonly CalendarItemResponse[], day: Date): CalendarItemResponse[] {
  return items.filter((item) => isSameDay(new Date(item.start), day));
}

function visibleWeekdays(
  weekStart: Date,
  showWeekends: boolean
): readonly { readonly date: Date; readonly weekday: number }[] {
  const days: { readonly date: Date; readonly weekday: number }[] = [];
  for (let i = 0; i < 7; i += 1) {
    const date = addDays(weekStart, i);
    const weekday = date.getDay();
    if (!showWeekends && (weekday === 0 || weekday === 6)) continue;
    days.push({ date, weekday });
  }
  return days;
}

interface EventChipProps {
  readonly event: CalendarItemResponse;
  readonly locale: string;
  readonly onItemClick: ((id: string) => void) | undefined;
  readonly compact?: boolean;
  readonly tileActions: readonly EntityActionManifest[];
  readonly dispatch: ReturnType<typeof useEntityActionDispatcher>;
}

function EventChip({ event, locale, onItemClick, compact, tileActions, dispatch }: EventChipProps) {
  const palette = hashColor(event.color);
  // Event start is a data timestamp — render it in the user's preferred
  // timezone (useTimezone), not the browser zone. The grid scaffolding
  // labels stay locale-only as they are calendar positions, not instants.
  const timeZone = useTimezone();
  const time = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone }).format(
        new Date(event.start)
      ),
    [event.start, locale, timeZone]
  );
  // Tile actions sit inline on the chip so a click on the icon-button
  // dispatches the action (PATCH / Navigate / …) and a click on the
  // chip body still calls `onItemClick` to drill into the row. The
  // `EntityActionButton` from `@granit/react-entities` stops click
  // propagation, so the two surfaces don't race.
  const showActions = !compact && tileActions.length > 0;
  const wrapperClass = cn(
    'flex w-full items-center gap-1 truncate rounded-sm border px-2 py-0.5 text-left text-xs transition-colors',
    palette,
    compact && 'px-1 py-0'
  );
  const content = (
    <>
      {!compact && <span className="font-mono opacity-70">{time}</span>}
      <span className="truncate flex-1">{event.title}</span>
    </>
  );
  const actions = showActions ? (
    <span data-slot="calendar-event-actions" className="ml-auto inline-flex items-center gap-0.5">
      {tileActions.map((action) => (
        <EntityActionButton
          key={action.name}
          action={action}
          rowId={event.id}
          row={null}
          dispatch={dispatch}
        />
      ))}
    </span>
  ) : null;

  if (!onItemClick) {
    return (
      <div
        data-slot="calendar-event"
        data-event-id={event.id}
        data-color={event.color ?? undefined}
        className={cn(wrapperClass, 'cursor-default')}
        title={`${time} — ${event.title}`}
      >
        {content}
        {actions}
      </div>
    );
  }

  // Clickable variant: outer is a real <button> for native keyboard / focus.
  // Action buttons sit inside but stop propagation themselves, so the nested
  // <button>-in-<button> is avoided by rendering them on a sibling span when
  // present — keeping the chip itself a single, navigable interactive control.
  if (showActions) {
    return (
      <div
        data-slot="calendar-event"
        data-event-id={event.id}
        data-color={event.color ?? undefined}
        className={wrapperClass}
        title={`${time} — ${event.title}`}
      >
        <button
          type="button"
          onClick={() => onItemClick(event.id)}
          className="flex flex-1 items-center gap-1 truncate text-left cursor-pointer hover:brightness-110"
        >
          {content}
        </button>
        {actions}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-slot="calendar-event"
      data-event-id={event.id}
      data-color={event.color ?? undefined}
      className={cn(wrapperClass, 'cursor-pointer hover:brightness-110')}
      title={`${time} — ${event.title}`}
      onClick={() => onItemClick(event.id)}
    >
      {content}
    </button>
  );
}

// ---- Day view ----
function DayView({ cursor, items, locale, onItemClick, t, tileActions, dispatch }: DayViewProps) {
  const dayEvents = useMemo(
    () =>
      eventsOnDay(items, cursor)
        .slice()
        .sort((a, b) => a.start.localeCompare(b.start)),
    [items, cursor]
  );
  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(cursor),
    [cursor, locale]
  );

  return (
    <div data-slot="calendar-day" className="flex flex-col">
      <div className="border-b border-border bg-muted/40 px-4 py-2 text-sm font-medium text-foreground">
        {dateLabel}
      </div>
      {dayEvents.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          {t('Entity.Calendar.Empty', 'No events in this window.')}
        </p>
      ) : (
        <ul className="flex flex-col gap-1 p-2">
          {dayEvents.map((event) => (
            <li key={event.id}>
              <EventChip
                event={event}
                locale={locale}
                onItemClick={onItemClick}
                tileActions={tileActions}
                dispatch={dispatch}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---- Week view ----
function WeekView({
  cursor,
  showWeekends,
  items,
  locale,
  onItemClick,
  tileActions,
  dispatch,
}: WeekViewProps) {
  const weekStart = useMemo(() => startOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON }), [cursor]);
  const days = useMemo(() => visibleWeekdays(weekStart, showWeekends), [weekStart, showWeekends]);
  const dayLabel = (date: Date) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric' }).format(date);

  return (
    <div
      data-slot="calendar-week"
      className="grid divide-x divide-border"
      style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
    >
      {days.map(({ date, weekday }) => {
        const dayEvents = eventsOnDay(items, date);
        const isWeekend = weekday === 0 || weekday === 6;
        return (
          <div
            key={date.toISOString()}
            data-day={format(date, 'yyyy-MM-dd')}
            data-weekend={isWeekend || undefined}
            className={cn(
              'flex min-h-72 flex-col',
              isToday(date) && 'bg-primary/5',
              isWeekend && 'bg-muted/30'
            )}
          >
            <div className="border-b border-border px-2 py-1 text-xs font-medium text-muted-foreground">
              {dayLabel(date)}
            </div>
            <ul className="flex flex-col gap-1 p-2">
              {dayEvents.map((event) => (
                <li key={event.id}>
                  <EventChip
                    event={event}
                    locale={locale}
                    onItemClick={onItemClick}
                    tileActions={tileActions}
                    dispatch={dispatch}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// ---- Month view ----
function MonthView({
  cursor,
  showWeekends,
  items,
  locale,
  onItemClick,
  tileActions,
  dispatch,
}: MonthViewProps) {
  const monthStart = useMemo(() => startOfMonth(cursor), [cursor]);
  const gridStart = useMemo(
    () => startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON }),
    [monthStart]
  );
  const gridEnd = useMemo(
    () => endOfWeek(endOfMonth(cursor), { weekStartsOn: WEEK_STARTS_ON }),
    [cursor]
  );

  const cells = useMemo(() => {
    const days: { date: Date; weekday: number }[] = [];
    let cur = gridStart;
    while (cur <= gridEnd) {
      const weekday = cur.getDay();
      if (showWeekends || (weekday !== 0 && weekday !== 6)) {
        days.push({ date: cur, weekday });
      }
      cur = addDays(cur, 1);
    }
    return days;
  }, [gridStart, gridEnd, showWeekends]);

  const colCount = showWeekends ? 7 : 5;
  const headerLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const labels: string[] = [];
    for (let i = 0; i < 7; i += 1) {
      const day = addDays(gridStart, i);
      const weekday = day.getDay();
      if (!showWeekends && (weekday === 0 || weekday === 6)) continue;
      labels.push(fmt.format(day));
    }
    return labels;
  }, [gridStart, locale, showWeekends]);

  return (
    <div data-slot="calendar-month" className="flex flex-col">
      <div
        data-slot="calendar-month-header"
        className="grid border-b border-border bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {headerLabels.map((label) => (
          <div key={label} className="px-2 py-2 text-center">
            {label}
          </div>
        ))}
      </div>
      <div
        data-slot="calendar-month-cells"
        className="grid divide-x divide-y divide-border"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {cells.map(({ date, weekday }) => {
          const dayEvents = eventsOnDay(items, date);
          const inMonth = isSameMonth(date, cursor);
          const isWeekend = weekday === 0 || weekday === 6;
          return (
            <div
              key={date.toISOString()}
              data-day={format(date, 'yyyy-MM-dd')}
              data-out-of-month={!inMonth || undefined}
              data-weekend={isWeekend || undefined}
              className={cn(
                'flex min-h-28 flex-col gap-1 p-1',
                !inMonth && 'bg-muted/30 text-muted-foreground',
                isToday(date) && 'bg-primary/5'
              )}
            >
              <span
                className={cn(
                  'inline-flex size-6 items-center justify-center rounded-full text-xs font-medium',
                  isToday(date) && 'bg-primary text-primary-foreground'
                )}
              >
                {format(date, 'd')}
              </span>
              <ul className="flex flex-col gap-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => (
                  <li key={event.id}>
                    <EventChip
                      event={event}
                      locale={locale}
                      onItemClick={onItemClick}
                      compact
                      tileActions={tileActions}
                      dispatch={dispatch}
                    />
                  </li>
                ))}
                {dayEvents.length > 3 && (
                  <li className="px-1 text-[10px] text-muted-foreground">
                    +{dayEvents.length - 3}
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Year view ----
function YearView({ cursor, showWeekends, items, locale }: YearViewProps) {
  const months = useMemo(() => {
    const yearStart = startOfYear(cursor);
    return Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));
  }, [cursor]);

  return (
    <div
      data-slot="calendar-year"
      className="grid gap-3 p-4"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))' }}
    >
      {months.map((monthDate) => (
        <YearMonthMini
          key={monthDate.toISOString()}
          monthDate={monthDate}
          showWeekends={showWeekends}
          items={items}
          locale={locale}
        />
      ))}
    </div>
  );
}

interface YearMonthMiniProps {
  readonly monthDate: Date;
  readonly showWeekends: boolean;
  readonly items: readonly CalendarItemResponse[];
  readonly locale: string;
}

function YearMonthMini({ monthDate, showWeekends, items, locale }: YearMonthMiniProps) {
  const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: WEEK_STARTS_ON });
  const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: WEEK_STARTS_ON });
  const cells: { date: Date; weekday: number }[] = [];
  let cur = gridStart;
  while (cur <= gridEnd) {
    const weekday = cur.getDay();
    if (showWeekends || (weekday !== 0 && weekday !== 6)) {
      cells.push({ date: cur, weekday });
    }
    cur = addDays(cur, 1);
  }
  const colCount = showWeekends ? 7 : 5;
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long' }).format(monthDate);

  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div className="mb-1 text-xs font-semibold text-foreground">{monthLabel}</div>
      <div
        className="grid gap-px"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {cells.map(({ date, weekday }) => {
          const inMonth = isSameMonth(date, monthDate);
          const dayEvents = eventsOnDay(items, date);
          const hasEvents = dayEvents.length > 0;
          const isWeekend = weekday === 0 || weekday === 6;
          return (
            <div
              key={date.toISOString()}
              className={cn(
                'flex aspect-square items-center justify-center rounded-sm text-[10px]',
                !inMonth && 'text-muted-foreground/40',
                inMonth && !hasEvents && 'text-foreground',
                inMonth && hasEvents && 'bg-primary/20 text-primary',
                isToday(date) && 'ring-1 ring-primary',
                isWeekend && inMonth && !hasEvents && 'bg-muted/40'
              )}
              title={
                hasEvents ? `${format(date, 'yyyy-MM-dd')} — ${dayEvents.length} events` : undefined
              }
            >
              {format(date, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}
