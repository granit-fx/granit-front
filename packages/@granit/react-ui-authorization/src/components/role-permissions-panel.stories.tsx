import { createApiClient } from '@granit/api-client';
import { AuthorizationProvider } from '@granit/react-authorization';
import { createAuthorizationHandlers } from '@granit/react-authorization/testing';
import { IdentityProvider } from '@granit/react-identity';
import { createIdentityHandlers } from '@granit/react-identity/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { RolePermissionsPanel } from './role-permissions-panel';

import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const meta: Meta<typeof RolePermissionsPanel> = {
  title: 'Authorization/RolePermissionsPanel',
  component: RolePermissionsPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [...createAuthorizationHandlers(), ...createIdentityHandlers()],
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <AuthorizationProvider config={{ client, basePath: '/api/v1/authorization' }}>
          <IdentityProvider config={{ client, providerBasePath: '/api/v1/identity/provider' }}>
            <Story />
          </IdentityProvider>
        </AuthorizationProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RolePermissionsPanel>;

export const Default: Story = {};
