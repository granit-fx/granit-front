import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { mockLocalizationOverrides } from '@granit/react-localization/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TranslationDeleteDialog } from './translation-delete-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof TranslationDeleteDialog> = {
  title: 'Features/Localization/TranslationDeleteDialog',
  component: TranslationDeleteDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <GranitClientProvider client={client}>
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      </GranitClientProvider>
    ),
  ],
  argTypes: {
    open: { control: 'boolean' },
    onOpenChange: { action: 'onOpenChange' },
  },
};

export default meta;
type Story = StoryObj<typeof TranslationDeleteDialog>;

export const Default: Story = {
  args: {
    override: mockLocalizationOverrides[0],
    open: true,
    onOpenChange: () => {},
  },
};

export const Closed: Story = {
  args: {
    override: mockLocalizationOverrides[0],
    open: false,
    onOpenChange: () => {},
  },
};
