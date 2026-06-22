import { createApiClient } from '@granit/api-client';
import { FeaturesProvider } from '@granit/react-features';
import { createFeaturesHandlers, mockFeatureDefinitions } from '@granit/react-features/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SetOverrideDialog } from './set-override-dialog';

import type { FeatureDefinitionResponse, FeatureValueResponse } from '@granit/features';
import type { Meta, StoryObj } from '@storybook/react-vite';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const client = createApiClient({ baseURL: '' });

const toggleDef = mockFeatureDefinitions.find((d) => d.valueType === 'Toggle')!;
const numericDef = mockFeatureDefinitions.find((d) => d.valueType === 'Numeric')!;
const selectionDef = mockFeatureDefinitions.find((d) => d.valueType === 'Selection')!;

const valueFor = (def: FeatureDefinitionResponse): FeatureValueResponse => ({
  name: def.name,
  value: def.defaultValue,
});

const meta: Meta<typeof SetOverrideDialog> = {
  title: 'Features/SetOverrideDialog',
  component: SetOverrideDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createFeaturesHandlers(),
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <FeaturesProvider config={{ client, basePath: '/api/v1/features' }}>
          <Story />
        </FeaturesProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SetOverrideDialog>;

export const Toggle: Story = {
  args: {
    definition: toggleDef,
    currentValue: valueFor(toggleDef),
  },
};

export const Numeric: Story = {
  args: {
    definition: numericDef,
    currentValue: valueFor(numericDef),
  },
};

export const Selection: Story = {
  args: {
    definition: selectionDef,
    currentValue: valueFor(selectionDef),
  },
};
