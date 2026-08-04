import { createApiClient } from '@granit/api-client';
import { AuthorizationProvider } from '@granit/react-authorization';
import { OpenIddictAdminProvider } from '@granit/react-openiddict-admin';
import { createOpenIddictAdminHandlers } from '@granit/react-openiddict-admin/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router';

import { OidcAuthorizationsPage } from './oidc-authorizations-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const permissionsHandler = (permissions: readonly string[]) =>
  http.get('/api/v1/authorization/permissions', () => HttpResponse.json({ permissions }));

const meta: Meta<typeof OidcAuthorizationsPage> = {
  title: 'OpenIddict/AuthorizationsPage',
  component: OidcAuthorizationsPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [
        ...createOpenIddictAdminHandlers('/api/v1/admin', '/api/v1/oidc'),
        permissionsHandler([
          'OpenIddict.Authorizations.Read',
          'OpenIddict.Authorizations.Create',
          'OpenIddict.Authorizations.Revoke',
        ]),
      ],
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <AuthorizationProvider config={{ client, basePath: '/api/v1/authorization' }}>
          <OpenIddictAdminProvider
            config={{ client, basePath: '/api/v1/admin', oidcBasePath: '/api/v1/oidc' }}
          >
            <MemoryRouter>
              <Story />
            </MemoryRouter>
          </OpenIddictAdminProvider>
        </AuthorizationProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof OidcAuthorizationsPage>;

/** Full admin view — consent can be granted and existing grants revoked. */
export const Default: Story = {};

/** Read-only view — without create / revoke permissions the actions are hidden. */
export const ReadOnly: Story = {
  parameters: {
    msw: {
      handlers: [
        ...createOpenIddictAdminHandlers('/api/v1/admin', '/api/v1/oidc'),
        permissionsHandler(['OpenIddict.Authorizations.Read']),
      ],
    },
  },
};
