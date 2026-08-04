import { createApiClient } from '@granit/api-client';
import { OpenIddictAdminProvider } from '@granit/react-openiddict-admin';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router';

import { ConsentPage } from './consent-page';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const currentUser = { sub: 'user-1' };

/** Stand-in for the host's public auth shell (centered card). */
const DemoLayout = ({ children }: { readonly children: ReactNode }) => (
  <div className="flex min-h-screen items-center justify-center bg-background px-4">
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6">{children}</div>
  </div>
);

const RETURN_URL = '/connect/authorize?client_id=demo-app&scope=openid%20profile%20email';

const consentAppHandler = http.get('/api/v1/oidc/applications/demo-app', () =>
  HttpResponse.json({ clientId: 'demo-app', displayName: 'Demo Application' })
);

const meta: Meta<typeof ConsentPage> = {
  title: 'OpenIddict/ConsentPage',
  component: ConsentPage,
  tags: ['autodocs'],
  args: { layout: DemoLayout, currentUser },
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: [consentAppHandler] },
  },
  decorators: [
    (Story, { parameters }) => (
      <QueryClientProvider client={queryClient}>
        <OpenIddictAdminProvider
          config={{ client, basePath: '/api/v1/admin', oidcBasePath: '/api/v1/oidc' }}
        >
          <MemoryRouter initialEntries={[(parameters.route as string) ?? '/consent']}>
            <Story />
          </MemoryRouter>
        </OpenIddictAdminProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ConsentPage>;

/** Authorization prompt: the relying party requests a set of scopes. */
export const Default: Story = {
  parameters: { route: `/consent?returnUrl=${encodeURIComponent(RETURN_URL)}` },
};

/** Reached without an OIDC authorization context — the page refuses to proceed. */
export const MissingReturnUrl: Story = {
  parameters: { route: '/consent' },
};
