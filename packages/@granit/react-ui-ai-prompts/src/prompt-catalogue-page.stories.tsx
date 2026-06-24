import { createApiClient } from '@granit/api-client';
import { AIPromptsProvider } from '@granit/react-ai-prompts';
import { createAIPromptsHandlers } from '@granit/react-ai-prompts/testing';
import { GranitClientProvider } from '@granit/react-api-client';
import { AuthorizationProvider } from '@granit/react-authorization';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { PromptCataloguePage } from './prompt-catalogue-page';
import { storyI18n } from './stories-i18n';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof PromptCataloguePage> = {
  title: 'AI Prompts/PromptCataloguePage',
  component: PromptCataloguePage,
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: createAIPromptsHandlers() },
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <QueryClientProvider client={queryClient}>
          <GranitClientProvider client={client}>
            <AuthorizationProvider config={{}}>
              <AIPromptsProvider config={{}}>
                <MemoryRouter>
                  <div className="p-6">
                    <Story />
                  </div>
                </MemoryRouter>
              </AIPromptsProvider>
            </AuthorizationProvider>
          </GranitClientProvider>
        </QueryClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The catalogue listing system and own prompts, backed by the mock prompt handlers. */
export const Default: Story = {};
