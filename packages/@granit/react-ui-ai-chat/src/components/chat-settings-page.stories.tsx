import { createApiClient } from '@granit/api-client';
import { AIChatProvider } from '@granit/react-ai-chat';
import { createAIChatHandlers } from '@granit/react-ai-chat/testing';
import { GranitClientProvider } from '@granit/react-api-client';
import { SettingsProvider } from '@granit/react-settings';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

import { ChatSettingsPage } from './chat-settings-page';

import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

// The preferences form reads the user settings scope and the chat workspace list.
// The workspace list is backed by MSW; the settings read falls through to
// `onUnhandledRequest: 'bypass'`, so the form initializes from its defaults.
const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const withSettingsProviders: Decorator = (Story) => (
  <GranitClientProvider client={client}>
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/ai/chat/settings']}>
        <AIChatProvider config={{}}>
          <SettingsProvider config={{}}>
            <div className="w-full p-6">{Story() as ReactNode}</div>
          </SettingsProvider>
        </AIChatProvider>
      </MemoryRouter>
    </QueryClientProvider>
  </GranitClientProvider>
);

const meta: Meta<typeof ChatSettingsPage> = {
  title: 'Features/AiChat/ChatSettingsPage',
  component: ChatSettingsPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: createAIChatHandlers() },
  },
  decorators: [withSettingsProviders],
};

export default meta;
type Story = StoryObj<typeof ChatSettingsPage>;

/** Per-user chat preferences: default workspace, web-search policy, custom context. */
export const Default: Story = {};
