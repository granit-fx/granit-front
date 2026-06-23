import { createApiClient } from '@granit/api-client';
import { AccountProvider } from '@granit/react-account';
import { createAccountHandlers } from '@granit/react-account/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ExternalLoginButtons } from './external-login-buttons';

import type { ExternalLoginProvider } from '@granit/account';
import type { Meta, StoryObj } from '@storybook/react-vite';

const BASE_PATH = '/api/v1/account';

const DEMO_PROVIDERS: readonly ExternalLoginProvider[] = [
  { name: 'Google', type: 'Google', displayName: 'Google' },
  { name: 'Microsoft', type: 'Microsoft', displayName: 'Microsoft' },
  { name: 'corp-sso', type: 'Oidc', displayName: 'Corporate SSO' },
  { name: 'Facebook', type: 'Facebook', displayName: 'Facebook' },
];

// Story-scoped MSW handlers: the button list is driven by `GET /config`, and
// `Facebook` returns 500 on challenge so the "provider unavailable" toast can be
// demoed live (the SDK has no IdP to redirect to under MSW).
function accountHandlers(externalProviders: readonly ExternalLoginProvider[]) {
  return createAccountHandlers(BASE_PATH, {
    externalProviders,
    unavailableProviders: ['Facebook'],
  });
}

// Each story gets its own QueryClient so the cached `/config` response from one
// story never leaks into another (e.g. the empty-list story).
function decorator(Story: () => React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const client = createApiClient({ baseURL: '' });
  return (
    <QueryClientProvider client={queryClient}>
      <AccountProvider config={{ client, basePath: BASE_PATH }}>
        <div className="w-80">
          <Story />
        </div>
      </AccountProvider>
    </QueryClientProvider>
  );
}

const meta: Meta<typeof ExternalLoginButtons> = {
  title: 'Account/ExternalLoginButtons',
  component: ExternalLoginButtons,
  tags: ['autodocs'],
  parameters: { layout: 'padded', msw: { handlers: accountHandlers(DEMO_PROVIDERS) } },
  decorators: [(Story) => decorator(Story)],
};

export default meta;
type Story = StoryObj<typeof ExternalLoginButtons>;

/** Sign-in screen: every available provider is offered. */
export const SignIn: Story = {
  args: { variant: 'sign-in' },
};

/** Account screen: Google and Microsoft are already linked, so they are hidden. */
export const LinkRemaining: Story = {
  args: { variant: 'link', linkedProviders: ['Google', 'Microsoft'] },
};

/** No providers configured: the component renders nothing. */
export const SignInNoProviders: Story = {
  args: { variant: 'sign-in' },
  parameters: { msw: { handlers: accountHandlers([]) } },
};
