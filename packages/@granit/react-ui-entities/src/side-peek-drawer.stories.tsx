import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { delay, http } from 'msw';
import { MemoryRouter } from 'react-router';

import { SidePeekDrawer } from './side-peek-drawer';

import type { Meta, StoryObj } from '@storybook/react-vite';

const mockApiClient = createApiClient({ baseURL: '' });

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

const meta: Meta<typeof SidePeekDrawer> = {
  title: 'Shared Components/SidePeekDrawer',
  component: SidePeekDrawer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Notion-style side peek drawer globally mounted in `<Layout />`. Driven by `useSidePeek` via the `?peek=` URL parameter. Renders the entity detail inline without leaving the current list page. Press Esc to close, ⌘+⇧+. to expand to the full detail page.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Closed state — no `?peek=` parameter in the URL. The Sheet is not open
 * and nothing is rendered on screen. This is the default state when the user
 * has not selected any row to peek at.
 */
export const Closed: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/parties']}>
        <QueryClientProvider client={makeQueryClient()}>
          <GranitClientProvider client={mockApiClient}>
            <div className="relative h-screen w-full bg-background">
              <div className="p-8 text-muted-foreground text-sm">
                List page content — no peek active.
              </div>
              <Story />
            </div>
          </GranitClientProvider>
        </QueryClientProvider>
      </MemoryRouter>
    ),
  ],
};

/**
 * Open state — a `?peek=Granit.Parties.Party:party-1` parameter is present
 * in the URL. The Sheet opens and `EntityDetailContent` starts loading the
 * entity manifest + data. The skeleton/loading state is shown until the API
 * responds (no MSW handler wired here, so the query stays pending).
 */
export const OpenWithPeek: Story = {
  parameters: {
    msw: {
      // Keep entity manifest + data requests pending so the drawer stays in its
      // skeleton/loading state — the story's intent per its JSDoc.
      handlers: [
        // Keep the entity discovery and manifest requests pending so the
        // drawer stays in its skeleton/loading state — the story's intent.
        http.get('/api/v1/entities', async () => {
          await delay('infinite');
        }),
        http.get('/api/v1/entities/:name', async () => {
          await delay('infinite');
        }),
      ],
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter
        initialEntries={[
          `/parties?peek=${encodeURIComponent('Granit.Parties.Party')}:${encodeURIComponent('party-1')}`,
        ]}
      >
        <QueryClientProvider client={makeQueryClient()}>
          <GranitClientProvider client={mockApiClient}>
            <div className="relative h-screen w-full bg-background">
              <div className="p-8 text-muted-foreground text-sm">
                List page content — peek drawer open alongside.
              </div>
              <Story />
            </div>
          </GranitClientProvider>
        </QueryClientProvider>
      </MemoryRouter>
    ),
  ],
};
