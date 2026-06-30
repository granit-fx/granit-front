import { createApiClient } from '@granit/api-client';
import { AIProvider } from '@granit/react-ai';
import { AIChatProvider } from '@granit/react-ai-chat';
import { createAIChatHandlers } from '@granit/react-ai-chat/testing';
import { AIPromptsProvider } from '@granit/react-ai-prompts';
import { GranitClientProvider } from '@granit/react-api-client';
import { SettingsProvider } from '@granit/react-settings';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import { ChatPage } from './chat-page';

import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

// One Axios client + QueryClient shared by every domain provider the page rides.
// The chat domain is backed by MSW (`parameters.msw`); the sibling AI / prompts /
// settings calls fall through to `onUnhandledRequest: 'bypass'`, so those panes
// render their empty/loading state — enough to showcase the page shell.
const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const withChatProviders: Decorator = (Story) => (
  <GranitClientProvider client={client}>
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/ai/chat']}>
        <AIChatProvider config={{}}>
          <AIProvider config={{}}>
            <AIPromptsProvider config={{}}>
              <SettingsProvider config={{}}>
                <div className="h-[80vh] w-full p-4">{Story() as ReactNode}</div>
              </SettingsProvider>
            </AIPromptsProvider>
          </AIProvider>
        </AIChatProvider>
      </MemoryRouter>
    </QueryClientProvider>
  </GranitClientProvider>
);

const meta: Meta<typeof ChatPage> = {
  title: 'Features/AiChat/ChatPage',
  component: ChatPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: createAIChatHandlers() },
  },
  decorators: [withChatProviders],
};

export default meta;
type Story = StoryObj<typeof ChatPage>;

/** Sidebar with seeded conversations + a fresh thread, served from MSW. */
export const Default: Story = {};
