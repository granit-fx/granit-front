import { GranitClientProvider } from '@granit/react-api-client';
import {
  ENTITIES_BASE_PATH,
  SAMPLE_ENTITY_ID,
  SAMPLE_ENTITY_NAME,
  createEntitiesHandlers,
  mockCalendarItems,
} from '@granit/react-entities/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { EntityCalendarView } from './entity-calendar-view';

import type { ExtendedEntityManifest } from './manifest-extensions';
import type { CalendarItemResponse, EntityCalendarLayoutManifest } from '@granit/entities';
import type { ReactNode } from 'react';

// Fully-qualified base so the MSW handlers match the axios `http://localhost`
// baseURL (the calendar hook hits `/api/v1/entities/{name}/calendar`).
const BASE = `http://localhost${ENTITIES_BASE_PATH}`;
const CALENDAR_PATH = `${BASE}/:name/calendar`;

// mockCalendarItems are dated 2026-05-04 (INV-001, colour Blue) and
// 2026-05-12 (INV-002, colour null). Pin "now" to 2026-05-04 so the
// default month cursor lands on May and the default day cursor lands on
// a day that actually has an event.
const FIXED_NOW = new Date('2026-05-04T12:00:00Z');

const LAYOUT: EntityCalendarLayoutManifest = {
  startPropertyName: 'StartDate',
  endPropertyName: 'EndDate',
  titlePropertyName: 'Number',
  colorByPropertyName: 'Status',
  actions: [],
};

const MANIFEST = {
  schemaVersion: 1,
  identity: null,
  permissions: null,
  forms: null,
  details: null,
  collections: null,
  relations: null,
  actions: [],
  activities: null,
} as unknown as ExtendedEntityManifest;

const JOIN_ACTION = {
  name: 'join',
  displayKey: 'Calendar.Action.Join',
  icon: 'video',
  contributorAssemblyName: null,
} as const;

const LAYOUT_WITH_ACTION: EntityCalendarLayoutManifest = {
  ...LAYOUT,
  actions: [JOIN_ACTION],
};

const MANIFEST_WITH_ACTIONS = {
  ...MANIFEST,
  actions: [
    {
      name: 'join',
      kind: 'Navigate' as const,
      displayKey: 'Calendar.Action.Join',
      icon: 'video',
      order: 0,
      urlTemplate: '/meetings/{id}/join',
      httpMethod: null,
      confirmationKey: null,
      workflowTransitionName: null,
      contributorAssemblyName: null,
    },
  ],
} as unknown as ExtendedEntityManifest;

const server = setupServer(...createEntitiesHandlers(BASE));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers(...createEntitiesHandlers(BASE)));
afterAll(() => server.close());

beforeEach(() => {
  // Fake only `Date` so MSW / React Query async timers stay real and
  // `waitFor` still resolves.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>{children}</GranitClientProvider>
    </QueryClientProvider>
  );
  return { wrapper };
}

interface RenderOptions {
  readonly layout?: EntityCalendarLayoutManifest;
  readonly manifest?: ExtendedEntityManifest;
  readonly onItemClick?: (id: string) => void;
  readonly actionHandlers?: Parameters<typeof EntityCalendarView>[0]['actionHandlers'];
}

function renderView(opts: RenderOptions = {}) {
  const { wrapper: Wrapper } = makeWrapper();
  return render(
    <Wrapper>
      <EntityCalendarView
        entityName={SAMPLE_ENTITY_NAME}
        manifest={opts.manifest ?? MANIFEST}
        layout={opts.layout ?? LAYOUT}
        onItemClick={opts.onItemClick}
        actionHandlers={opts.actionHandlers}
      />
    </Wrapper>
  );
}

function tabs(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll('[role="tab"]'));
}

// day / week / month / year, in VIEW_MODES order.
function selectMode(container: HTMLElement, index: 0 | 1 | 2 | 3) {
  fireEvent.click(tabs(container)[index]!);
}

function events(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('[data-slot="calendar-event"]'));
}

function navButtons(container: HTMLElement): HTMLButtonElement[] {
  const toolbar = container.querySelector('[data-slot="entity-calendar-toolbar"]') as HTMLElement;
  const group = toolbar.querySelector('div') as HTMLElement;
  return Array.from(group.querySelectorAll('button'));
}

describe('EntityCalendarView', () => {
  it('renders the toolbar and defaults to the month grid with layout data attrs', async () => {
    const { container } = renderView();
    const grid = container.querySelector('[data-slot="entity-calendar-grid"]') as HTMLElement;
    expect(container.querySelector('[data-slot="entity-calendar-toolbar"]')).not.toBeNull();
    expect(grid.getAttribute('data-mode')).toBe('month');
    expect(grid.getAttribute('data-start-property')).toBe('StartDate');
    expect(grid.getAttribute('data-end-property')).toBe('EndDate');
    expect(grid.getAttribute('data-color-property')).toBe('Status');
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-month"]')).not.toBeNull()
    );
  });

  it('omits optional layout data attrs when the manifest leaves them null', async () => {
    const slim: EntityCalendarLayoutManifest = {
      startPropertyName: 'StartDate',
      endPropertyName: null,
      titlePropertyName: null,
      colorByPropertyName: null,
      actions: [],
    };
    const { container } = renderView({ layout: slim });
    const grid = container.querySelector('[data-slot="entity-calendar-grid"]') as HTMLElement;
    expect(grid.getAttribute('data-start-property')).toBe('StartDate');
    expect(grid.hasAttribute('data-end-property')).toBe(false);
    expect(grid.hasAttribute('data-color-property')).toBe(false);
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-month"]')).not.toBeNull()
    );
  });

  it('marks the grid as loading before the range response lands', () => {
    const { container } = renderView();
    const grid = container.querySelector('[data-slot="entity-calendar-grid"]') as HTMLElement;
    expect(grid.getAttribute('data-loading')).toBe('true');
  });

  it('renders an error alert when the range endpoint returns 500', async () => {
    server.use(http.get(CALENDAR_PATH, () => new HttpResponse(null, { status: 500 })));
    const { container } = renderView();
    await waitFor(() => expect(container.querySelector('[role="alert"]')).not.toBeNull());
    const grid = container.querySelector('[data-slot="entity-calendar-grid"]') as HTMLElement;
    expect(grid.getAttribute('data-error')).toBe('true');
    // The grid short-circuits to the alert and never paints a sub-view.
    expect(container.querySelector('[data-slot="calendar-month"]')).toBeNull();
  });

  it('paints one tile per event and forwards the colour attr (null omitted)', async () => {
    const { container } = renderView();
    await waitFor(() => expect(events(container)).toHaveLength(2));
    const inv001 = container.querySelector(`[data-event-id="${SAMPLE_ENTITY_ID}"]`) as HTMLElement;
    expect(inv001.getAttribute('data-color')).toBe('Blue');
    const inv002 = container.querySelector(
      '[data-event-id="8c6b1e10-0000-4000-8000-000000000002"]'
    ) as HTMLElement;
    expect(inv002.hasAttribute('data-color')).toBe(false);
  });

  it('renders no tiles when the endpoint returns an empty range', async () => {
    server.use(http.get(CALENDAR_PATH, () => HttpResponse.json([])));
    const { container } = renderView();
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-month"]')).not.toBeNull()
    );
    expect(events(container)).toHaveLength(0);
  });

  it('switches to the day view and shows the event on the cursor day', async () => {
    const { container } = renderView();
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-month"]')).not.toBeNull()
    );
    selectMode(container, 0);
    const grid = container.querySelector('[data-slot="entity-calendar-grid"]') as HTMLElement;
    expect(grid.getAttribute('data-mode')).toBe('day');
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-day"]')).not.toBeNull()
    );
    expect(events(container)).toHaveLength(1);
  });

  it('renders the day-view empty state when the cursor day has no events', async () => {
    const { container } = renderView();
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-month"]')).not.toBeNull()
    );
    selectMode(container, 0);
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-day"]')).not.toBeNull()
    );
    // Advance one day (05-05) — no events there.
    fireEvent.click(navButtons(container)[2]!);
    await waitFor(() => expect(events(container)).toHaveLength(0));
    expect(container.querySelector('[data-slot="calendar-day"] p')).not.toBeNull();
  });

  it('switches to the week view and renders the week grid', async () => {
    const { container } = renderView();
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-month"]')).not.toBeNull()
    );
    selectMode(container, 1);
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-week"]')).not.toBeNull()
    );
    expect(events(container)).toHaveLength(1);
  });

  it('switches to the year view and renders twelve month minis', async () => {
    const { container } = renderView();
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-month"]')).not.toBeNull()
    );
    selectMode(container, 3);
    const year = await waitFor(() => {
      const node = container.querySelector('[data-slot="calendar-year"]');
      expect(node).not.toBeNull();
      return node as HTMLElement;
    });
    expect(year.children).toHaveLength(12);
  });

  it('navigates forward and back and resets to today across the month view', async () => {
    const { container } = renderView();
    await waitFor(() => expect(events(container)).toHaveLength(2));
    // June 2026 grid holds no May events.
    fireEvent.click(navButtons(container)[2]!);
    await waitFor(() => expect(events(container)).toHaveLength(0));
    // Today resets the cursor back to May.
    fireEvent.click(navButtons(container)[1]!);
    await waitFor(() => expect(events(container)).toHaveLength(2));
    // Prev steps to April (no May events).
    fireEvent.click(navButtons(container)[0]!);
    await waitFor(() => expect(events(container)).toHaveLength(0));
  });

  it.each([
    ['day', 0],
    ['week', 1],
    ['month', 2],
    ['year', 3],
  ] as const)('steps the cursor forward and back in the %s view', async (mode, index) => {
    const { container } = renderView();
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-month"]')).not.toBeNull()
    );
    selectMode(container, index);
    await waitFor(() =>
      expect(container.querySelector(`[data-slot="calendar-${mode}"]`)).not.toBeNull()
    );
    fireEvent.click(navButtons(container)[2]!);
    fireEvent.click(navButtons(container)[0]!);
    await waitFor(() =>
      expect(container.querySelector(`[data-slot="calendar-${mode}"]`)).not.toBeNull()
    );
  });

  it('hides weekend columns when the show-weekends switch is toggled off', async () => {
    const { container } = renderView();
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-month"]')).not.toBeNull()
    );
    const grid = container.querySelector('[data-slot="entity-calendar-grid"]') as HTMLElement;
    expect(grid.getAttribute('data-show-weekends')).toBe('true');
    const header = container.querySelector('[data-slot="calendar-month-header"]') as HTMLElement;
    expect(header.children).toHaveLength(7);

    fireEvent.click(container.querySelector('[role="switch"]') as HTMLElement);

    expect(grid.hasAttribute('data-show-weekends')).toBe(false);
    await waitFor(() =>
      expect(
        (container.querySelector('[data-slot="calendar-month-header"]') as HTMLElement).children
      ).toHaveLength(5)
    );
  });

  it('renders event tiles as buttons and fires onItemClick with the row id (compact month tile)', async () => {
    const onItemClick = vi.fn();
    const { container } = renderView({ onItemClick });
    await waitFor(() => expect(events(container)).toHaveLength(2));
    const chip = container.querySelector(`[data-event-id="${SAMPLE_ENTITY_ID}"]`) as HTMLElement;
    expect(chip.tagName).toBe('BUTTON');
    fireEvent.click(chip);
    expect(onItemClick).toHaveBeenCalledWith(SAMPLE_ENTITY_ID);
  });

  it('renders a non-interactive chip (div) when no onItemClick is supplied', async () => {
    const { container } = renderView();
    await waitFor(() => expect(events(container)).toHaveLength(2));
    const chip = container.querySelector(`[data-event-id="${SAMPLE_ENTITY_ID}"]`) as HTMLElement;
    expect(chip.tagName).toBe('DIV');
  });

  it('paints resolved tile actions in the day view and dispatches via the navigate handler', async () => {
    const navigate = vi.fn();
    const onItemClick = vi.fn();
    const { container } = renderView({
      layout: LAYOUT_WITH_ACTION,
      manifest: MANIFEST_WITH_ACTIONS,
      onItemClick,
      actionHandlers: { navigate },
    });
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-month"]')).not.toBeNull()
    );
    // Month tiles are compact → no inline actions there.
    expect(container.querySelector('[data-granit-entity-action]')).toBeNull();
    // Day tiles are full-size → actions surface next to the chip body.
    selectMode(container, 0);
    await waitFor(() =>
      expect(container.querySelector('[data-granit-entity-action]')).not.toBeNull()
    );
    // Chip is a wrapper div with an inner button for row activation.
    const chip = container.querySelector(`[data-event-id="${SAMPLE_ENTITY_ID}"]`) as HTMLElement;
    expect(chip.tagName).toBe('DIV');
    fireEvent.click(chip.querySelector('button:not([data-granit-entity-action])') as HTMLElement);
    expect(onItemClick).toHaveBeenCalledWith(SAMPLE_ENTITY_ID);

    fireEvent.click(container.querySelector('[data-granit-entity-action]') as HTMLElement);
    expect(navigate).toHaveBeenCalledOnce();
  });

  it('renders tile actions with no onItemClick (chip stays a div, actions only)', async () => {
    const { container } = renderView({
      layout: LAYOUT_WITH_ACTION,
      manifest: MANIFEST_WITH_ACTIONS,
    });
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-month"]')).not.toBeNull()
    );
    selectMode(container, 0);
    await waitFor(() =>
      expect(container.querySelector('[data-granit-entity-action]')).not.toBeNull()
    );
    const chip = container.querySelector(`[data-event-id="${SAMPLE_ENTITY_ID}"]`) as HTMLElement;
    expect(chip.tagName).toBe('DIV');
    // No row-activation button, only the action button.
    const bodyButtons = Array.from(chip.querySelectorAll('button')).filter(
      (b) => !b.hasAttribute('data-granit-entity-action')
    );
    expect(bodyButtons).toHaveLength(0);
  });

  it('renders no action bar when layout declares actions but the manifest omits them', async () => {
    const manifestNoActions = { ...MANIFEST, actions: null } as unknown as ExtendedEntityManifest;
    const { container } = renderView({
      layout: LAYOUT_WITH_ACTION,
      manifest: manifestNoActions,
    });
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-month"]')).not.toBeNull()
    );
    selectMode(container, 0);
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-day"]')).not.toBeNull()
    );
    expect(container.querySelector('[data-granit-entity-action]')).toBeNull();
  });

  it('drops weekend columns in the week view when show-weekends is toggled off', async () => {
    const { container } = renderView();
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-month"]')).not.toBeNull()
    );
    selectMode(container, 1);
    const week = await waitFor(() => {
      const node = container.querySelector('[data-slot="calendar-week"]');
      expect(node).not.toBeNull();
      return node as HTMLElement;
    });
    expect(week.children).toHaveLength(7);

    fireEvent.click(container.querySelector('[role="switch"]') as HTMLElement);

    await waitFor(() =>
      expect(
        (container.querySelector('[data-slot="calendar-week"]') as HTMLElement).children
      ).toHaveLength(5)
    );
    // No Saturday/Sunday columns remain once weekends are hidden.
    expect(container.querySelector('[data-slot="calendar-week"] [data-weekend]')).toBeNull();
  });

  it('drops weekend cells in the year-view month minis when show-weekends is toggled off', async () => {
    const { container } = renderView();
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-month"]')).not.toBeNull()
    );
    selectMode(container, 3);
    const year = await waitFor(() => {
      const node = container.querySelector('[data-slot="calendar-year"]');
      expect(node).not.toBeNull();
      return node as HTMLElement;
    });
    const cellsBefore = year.querySelectorAll('.aspect-square').length;

    fireEvent.click(container.querySelector('[role="switch"]') as HTMLElement);

    // The 5-column minis render strictly fewer day cells than the 7-column ones.
    await waitFor(() => {
      const cellsAfter = (
        container.querySelector('[data-slot="calendar-year"]') as HTMLElement
      ).querySelectorAll('.aspect-square').length;
      expect(cellsAfter).toBeLessThan(cellsBefore);
    });
    expect(
      (container.querySelector('[data-slot="calendar-year"]') as HTMLElement).children
    ).toHaveLength(12);
  });

  it('renders a null-colour event as a full-size clickable chip with tile actions', async () => {
    const nullColorEvent: CalendarItemResponse = {
      ...(mockCalendarItems[1] as CalendarItemResponse),
      start: '2026-05-04T09:00:00Z',
    };
    server.use(http.get(CALENDAR_PATH, () => HttpResponse.json([nullColorEvent])));
    const onItemClick = vi.fn();
    const { container } = renderView({
      layout: LAYOUT_WITH_ACTION,
      manifest: MANIFEST_WITH_ACTIONS,
      onItemClick,
    });
    await waitFor(() =>
      expect(container.querySelector('[data-slot="calendar-month"]')).not.toBeNull()
    );
    selectMode(container, 0);
    await waitFor(() =>
      expect(container.querySelector('[data-granit-entity-action]')).not.toBeNull()
    );
    const chip = container.querySelector('[data-slot="calendar-event"]') as HTMLElement;
    // showActions + onItemClick path: wrapper div, null colour attr omitted.
    expect(chip.tagName).toBe('DIV');
    expect(chip.hasAttribute('data-color')).toBe(false);
    fireEvent.click(chip.querySelector('button:not([data-granit-entity-action])') as HTMLElement);
    expect(onItemClick).toHaveBeenCalledWith(nullColorEvent.id);
  });

  it('caps month-cell tiles at three and shows a "+N" overflow marker, sorting the day view', async () => {
    const day = '2026-05-04';
    const fourEvents: readonly CalendarItemResponse[] = [
      { id: 'evt-1', start: `${day}T11:00:00Z`, end: null, title: 'D', color: 'Blue' },
      { id: 'evt-2', start: `${day}T08:00:00Z`, end: null, title: 'A', color: 'Green' },
      { id: 'evt-3', start: `${day}T10:00:00Z`, end: null, title: 'C', color: null },
      { id: 'evt-4', start: `${day}T09:00:00Z`, end: null, title: 'B', color: 'Red' },
    ];
    server.use(http.get(CALENDAR_PATH, () => HttpResponse.json([...fourEvents])));
    const { container } = renderView();
    // Month cells cap at 3 tiles; the fourth collapses into a "+1" marker.
    await waitFor(() => expect(events(container)).toHaveLength(3));
    const cell = container.querySelector(`[data-day="${day}"]`) as HTMLElement;
    expect(cell.textContent).toContain('+1');

    // Day view lists all four, sorted ascending by start (comparator runs).
    selectMode(container, 0);
    await waitFor(() => expect(events(container)).toHaveLength(4));
    const titles = Array.from(container.querySelectorAll('[data-slot="calendar-event"]')).map(
      (chip) => (chip.querySelector('.flex-1') as HTMLElement).textContent
    );
    expect(titles).toEqual(['A', 'B', 'C', 'D']);
  });
});
