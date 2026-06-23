import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from 'storybook/test';

import { LanguagesContext } from '../languages-context';

import { TranslationCreateDialog } from './translation-create-dialog';

import type { LanguageInfo } from '@granit/localization';
import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const sampleLanguages: LanguageInfo[] = [
  { cultureName: 'en-GB', displayName: 'English (UK)', isDefault: true },
  { cultureName: 'fr-FR', displayName: 'Français', isDefault: false },
  { cultureName: 'nl-BE', displayName: 'Nederlands', isDefault: false },
];

const meta: Meta<typeof TranslationCreateDialog> = {
  title: 'Features/Localization/TranslationCreateDialog',
  component: TranslationCreateDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <GranitClientProvider client={client}>
        <QueryClientProvider client={queryClient}>
          <LanguagesContext.Provider value={sampleLanguages}>
            <Story />
          </LanguagesContext.Provider>
        </QueryClientProvider>
      </GranitClientProvider>
    ),
  ],
  argTypes: {
    open: { control: 'boolean' },
    onOpenChange: { action: 'onOpenChange' },
    onCreated: { action: 'onCreated' },
  },
};

export default meta;
type Story = StoryObj<typeof TranslationCreateDialog>;

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
    onCreated: fn(),
  },
};

export const Closed: Story = {
  args: {
    open: false,
    onOpenChange: fn(),
    onCreated: fn(),
  },
};
