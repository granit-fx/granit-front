import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { EntityCalendar } from '../components/entity-calendar.js';

import type { CalendarItemResponse, EntityCalendarLayoutManifest } from '@granit/entities';
import type { ReactNode } from 'react';

const ENTITY = 'Granit.Invoicing.Invoice';
const PATH = `http://localhost/entities/${encodeURIComponent(ENTITY)}/calendar`;
const FROM = '2026-05-01T00:00:00Z';
const TO = '2026-05-31T23:59:59Z';

const LAYOUT: EntityCalendarLayoutManifest = {
  startPropertyName: 'StartDate',
  endPropertyName: 'EndDate',
  titlePropertyName: 'Number',
  colorByPropertyName: 'Status',
  actions: [],
};

const ITEMS: readonly CalendarItemResponse[] = [
  {
    id: '8c6b1e10-0000-4000-8000-000000000003',
    start: '2026-05-12T00:00:00Z',
    end: null,
    title: 'INV-002',
    color: null,
  },
  {
    id: '8c6b1e10-0000-4000-8000-000000000001',
    start: '2026-05-04T09:00:00Z',
    end: '2026-05-04T10:30:00Z',
    title: 'INV-001',
    color: 'Blue',
  },
  {
    id: '8c6b1e10-0000-4000-8000-000000000002',
    start: '2026-05-04T15:00:00Z',
    end: null,
    title: 'INV-003',
    color: 'Green',
  },
];

function freshHandlers(items: readonly CalendarItemResponse[] = ITEMS) {
  return [http.get(PATH, () => HttpResponse.json(items))];
}

const server = setupServer(...freshHandlers());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers(...freshHandlers()));
afterAll(() => server.close());

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

describe('EntityCalendar', () => {
  it('exposes range + layout property names as data attributes on the root', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityCalendar entityName={ENTITY} layout={LAYOUT} range={{ from: FROM, to: TO }} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-calendar-day]')).not.toBeNull()
    );
    const root = container.querySelector('[data-granit-entity-calendar]') as HTMLElement;
    expect(root.getAttribute('data-entity')).toBe(ENTITY);
    expect(root.getAttribute('data-from')).toBe(FROM);
    expect(root.getAttribute('data-to')).toBe(TO);
    expect(root.getAttribute('data-start-property')).toBe('StartDate');
    expect(root.getAttribute('data-end-property')).toBe('EndDate');
    expect(root.getAttribute('data-color-property')).toBe('Status');
  });

  it('groups events by start-day and sorts the day list ascending', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityCalendar entityName={ENTITY} layout={LAYOUT} range={{ from: FROM, to: TO }} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-calendar-day]').length).toBe(2)
    );
    const days = Array.from(container.querySelectorAll('[data-granit-calendar-day]'));
    expect(days.map((d) => d.getAttribute('data-day'))).toEqual(['2026-05-04', '2026-05-12']);
    const may4Events = days[0].querySelectorAll('[data-granit-calendar-event]');
    expect(may4Events).toHaveLength(2);
    expect(Array.from(may4Events).map((e) => e.textContent)).toEqual(['INV-001', 'INV-003']);
  });

  it('forwards start / end / color data attrs onto each event node', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityCalendar entityName={ENTITY} layout={LAYOUT} range={{ from: FROM, to: TO }} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-calendar-event]')).not.toBeNull()
    );
    const inv001 = container.querySelector(
      '[data-event-id="8c6b1e10-0000-4000-8000-000000000001"]'
    ) as HTMLElement;
    expect(inv001.getAttribute('data-start')).toBe('2026-05-04T09:00:00Z');
    expect(inv001.getAttribute('data-end')).toBe('2026-05-04T10:30:00Z');
    expect(inv001.getAttribute('data-color')).toBe('Blue');

    const inv002 = container.querySelector(
      '[data-event-id="8c6b1e10-0000-4000-8000-000000000003"]'
    ) as HTMLElement;
    expect(inv002.hasAttribute('data-end')).toBe(false);
    expect(inv002.hasAttribute('data-color')).toBe(false);
  });

  it('emits a loading marker before the response lands', () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityCalendar entityName={ENTITY} layout={LAYOUT} range={{ from: FROM, to: TO }} />
      </Wrapper>
    );
    expect(container.querySelector('[data-granit-calendar-loading]')).not.toBeNull();
  });

  it('emits an empty marker when the endpoint returns no items', async () => {
    server.use(...freshHandlers([]));
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityCalendar entityName={ENTITY} layout={LAYOUT} range={{ from: FROM, to: TO }} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-calendar-empty]')).not.toBeNull()
    );
    expect(container.querySelector('[data-granit-calendar-day]')).toBeNull();
  });

  it('emits an error marker with role=alert when the endpoint returns 500', async () => {
    server.use(http.get(PATH, () => HttpResponse.json({ error: 'boom' }, { status: 500 })));
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityCalendar entityName={ENTITY} layout={LAYOUT} range={{ from: FROM, to: TO }} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-calendar-error]')).not.toBeNull()
    );
    expect(container.querySelector('[data-granit-calendar-error]')?.getAttribute('role')).toBe(
      'alert'
    );
  });

  it('invokes onItemClick with the full event object', async () => {
    const onItemClick = vi.fn();
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityCalendar
          entityName={ENTITY}
          layout={LAYOUT}
          range={{ from: FROM, to: TO }}
          onItemClick={onItemClick}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-calendar-event]')).not.toBeNull()
    );
    const inv001Li = container.querySelector(
      '[data-event-id="8c6b1e10-0000-4000-8000-000000000001"]'
    ) as HTMLElement;
    const inv001Button = inv001Li.querySelector('button') as HTMLButtonElement;
    fireEvent.click(inv001Button);
    expect(onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: '8c6b1e10-0000-4000-8000-000000000001', title: 'INV-001' })
    );
  });

  it('omits optional layout data attrs when the manifest leaves them null', async () => {
    const slimLayout: EntityCalendarLayoutManifest = {
      startPropertyName: 'StartDate',
      endPropertyName: null,
      titlePropertyName: null,
      colorByPropertyName: null,
      actions: [],
    };
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityCalendar entityName={ENTITY} layout={slimLayout} range={{ from: FROM, to: TO }} />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-calendar-day]')).not.toBeNull()
    );
    const root = container.querySelector('[data-granit-entity-calendar]') as HTMLElement;
    expect(root.getAttribute('data-start-property')).toBe('StartDate');
    expect(root.hasAttribute('data-end-property')).toBe(false);
    expect(root.hasAttribute('data-color-property')).toBe(false);
  });

  it('paints layout.actions on each calendar event tile and dispatches via the custom navigate handler', async () => {
    const layoutWithAction: EntityCalendarLayoutManifest = {
      ...LAYOUT,
      actions: [
        {
          name: 'join',
          displayKey: 'Calendar.Action.Join',
          icon: 'video',
          contributorAssemblyName: null,
        },
      ],
    };
    const manifestWithActions = {
      schemaVersion: 1,
      identity: null,
      permissions: null,
      forms: null,
      details: null,
      collections: null,
      relations: null,
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
    };
    const navigate = vi.fn();
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityCalendar
          entityName={ENTITY}
          layout={layoutWithAction}
          range={{ from: FROM, to: TO }}
          manifest={manifestWithActions}
          actionHandlers={{ navigate }}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-granit-entity-action]').length).toBe(ITEMS.length)
    );
    fireEvent.click(container.querySelector('[data-granit-entity-action]') as HTMLElement);
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'join', kind: 'Navigate' }),
      expect.any(String),
      expect.objectContaining({ start: expect.any(String) }),
      expect.anything()
    );
  });

  it('omits the action bar when no manifest is supplied (graceful degradation)', async () => {
    const layoutWithAction: EntityCalendarLayoutManifest = {
      ...LAYOUT,
      actions: [{ name: 'join', displayKey: null, icon: 'video', contributorAssemblyName: null }],
    };
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <EntityCalendar
          entityName={ENTITY}
          layout={layoutWithAction}
          range={{ from: FROM, to: TO }}
        />
      </Wrapper>
    );
    await waitFor(() =>
      expect(container.querySelector('[data-granit-calendar-event]')).not.toBeNull()
    );
    expect(container.querySelector('[data-granit-entity-action]')).toBeNull();
  });
});
