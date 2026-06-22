import { createApiClient } from '@granit/api-client';
import { IdentityProvider } from '@granit/react-identity';
import { PresenceProvider } from '@granit/react-presence';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { PresenceDemoPage } from './presence-demo-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof PresenceDemoPage> = {
  title: 'Presence/PresenceDemoPage',
  component: PresenceDemoPage,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <IdentityProvider config={{ client, providerBasePath: '/api/v1/identity/provider' }}>
          <PresenceProvider config={{ client, basePath: '/api/v1' }}>
            <Story />
          </PresenceProvider>
        </IdentityProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The presence demo page. The headless hooks resolve their Axios client from the
 * `PresenceProvider` / `IdentityProvider` decorators above; with no live backend
 * the cards render their loading / empty states.
 */
export const Default: Story = {};
