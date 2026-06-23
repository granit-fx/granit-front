import { createApiClient } from '@granit/api-client';
import { TemplatingProvider } from '@granit/react-templating';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TEMPLATING_CONFIG } from '../constants';

import { TemplateForm } from './template-form';

import type { Meta, StoryObj } from '@storybook/react-vite';

const storyClient = createApiClient({ baseURL: '' });

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const meta: Meta<typeof TemplateForm> = {
  title: 'Features/Templates/TemplateForm',
  component: TemplateForm,
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'radio',
      options: ['create', 'edit'],
    },
    isSubmitting: {
      control: 'boolean',
    },
    onSubmit: { action: 'onSubmit' },
    onCancel: { action: 'onCancel' },
  },
  args: {
    onSubmit: async () => {},
    onCancel: () => {},
    isSubmitting: false,
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <TemplatingProvider config={{ ...TEMPLATING_CONFIG, client: storyClient }}>
          <Story />
        </TemplatingProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  args: {
    mode: 'create',
  },
};

export const Edit: Story = {
  args: {
    mode: 'edit',
    defaultValues: {
      name: 'Billing.Invoice',
      culture: 'fr',
      categoryId: 'cat-1',
      content: '<h1>{{ model.title }}</h1>\n<p>Montant: {{ model.amount }} EUR</p>',
      mimeType: 'text/html',
    },
  },
};

export const Submitting: Story = {
  args: {
    mode: 'create',
    isSubmitting: true,
  },
};
