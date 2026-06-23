import { createApiClient } from '@granit/api-client';
import { OpenIddictAdminProvider } from '@granit/react-openiddict-admin';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';

import { DevicePage } from './device-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

/** RFC 8628 device verification — succeeds for any non-empty user code. */
const verifyHandler = http.post('/connect/verify', async ({ request }) => {
  const body = new URLSearchParams(await request.text());
  const userCode = body.get('user_code') ?? '';
  if (!userCode.trim()) {
    return HttpResponse.json({ error: 'invalid_user_code' }, { status: 400 });
  }
  return new HttpResponse(null, { status: 200 });
});

const meta: Meta<typeof DevicePage> = {
  title: 'OpenIddict/DevicePage',
  component: DevicePage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: [verifyHandler] },
  },
  decorators: [
    (Story, { parameters }) => (
      <QueryClientProvider client={queryClient}>
        <OpenIddictAdminProvider
          config={{ client, basePath: '/api/v1/admin', oidcBasePath: '/api/v1/oidc' }}
        >
          <MemoryRouter initialEntries={[(parameters.route as string) ?? '/device']}>
            <Story />
          </MemoryRouter>
        </OpenIddictAdminProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DevicePage>;

/** Empty form — the user types the code printed on their device. */
export const Default: Story = {};

/** Code pre-filled from the `user_code` query parameter (deep link from the device). */
export const PrefilledCode: Story = {
  parameters: { route: '/device?user_code=WDJB-MJHT' },
};
