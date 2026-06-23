import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { fn } from 'storybook/test';

import { EntityCalendarView } from './entity-calendar-view';

import type { ExtendedEntityManifest } from './manifest-extensions';
import type { CalendarItemResponse, EntityCalendarLayoutManifest } from '@granit/entities';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockApiClient = createApiClient({ baseURL: '' });

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

// Anchor events on the current month so the default month view shows them
// regardless of when the story runs.
const now = new Date();
function dayInMonth(day: number, hour = 9): string {
  return new Date(now.getFullYear(), now.getMonth(), day, hour, 0, 0).toISOString();
}

const events: readonly CalendarItemResponse[] = [
  {
    id: '1',
    start: dayInMonth(4, 9),
    end: dayInMonth(4, 10),
    title: 'Kickoff meeting',
    color: 'Blue',
  },
  { id: '2', start: dayInMonth(12, 14), end: null, title: 'Design review', color: 'Green' },
  { id: '3', start: dayInMonth(12, 16), end: null, title: 'Sprint planning', color: 'Orange' },
  { id: '4', start: dayInMonth(20, 11), end: dayInMonth(20, 12), title: 'Demo day', color: 'Blue' },
];

const layout: EntityCalendarLayoutManifest = {
  startPropertyName: 'StartsAt',
  endPropertyName: 'EndsAt',
  titlePropertyName: 'Title',
  colorByPropertyName: 'Status',
  actions: [],
};

const manifest = {
  schemaVersion: 1,
  identity: {
    name: 'Granit.Scheduling.Event',
    entityClrType: 'Granit.Scheduling.Event',
    displayKey: null,
    icon: null,
    permissionGroup: 'Scheduling.Events',
    displayProperty: 'Title',
    subtitleProperty: null,
  },
  permissions: null,
  forms: null,
  details: null,
  collections: null,
  relations: null,
  actions: [],
  activities: null,
} as unknown as ExtendedEntityManifest;

const meta = {
  title: 'Layout/EntityCalendarView',
  component: EntityCalendarView,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Manifest-driven calendar (Odoo-style). Owns the visible window (cursor + day/week/month/year mode + show-weekends) and fetches events for the range via the `GET /entities/{name}/calendar` endpoint, painting one tile per `CalendarItemResponse`.',
      },
    },
    msw: {
      handlers: [http.get('/api/v1/entities/:name/calendar', () => HttpResponse.json(events))],
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={makeQueryClient()}>
        <GranitClientProvider client={mockApiClient}>
          <div className="bg-background p-6">
            <Story />
          </div>
        </GranitClientProvider>
      </QueryClientProvider>
    ),
  ],
  args: {
    entityName: 'Granit.Scheduling.Event',
    manifest,
    layout,
    onItemClick: fn(),
  },
} satisfies Meta<typeof EntityCalendarView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default month view with a handful of events across the current month. */
export const MonthView: Story = {};

/** No events returned for the range — the grid renders empty cells. */
export const NoEvents: Story = {
  parameters: {
    msw: {
      handlers: [http.get('/api/v1/entities/:name/calendar', () => HttpResponse.json([]))],
    },
  },
};

/** The range request fails — the grid surfaces the load-error alert. */
export const LoadError: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v1/entities/:name/calendar', () => new HttpResponse(null, { status: 500 })),
      ],
    },
  },
};
