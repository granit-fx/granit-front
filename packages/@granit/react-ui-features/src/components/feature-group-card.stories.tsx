import { mockFeatureGroups, mockFeatureValues } from '@granit/react-features/testing';
import { MemoryRouter } from 'react-router-dom';

import { FeatureGroupCard } from './feature-group-card';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof FeatureGroupCard> = {
  title: 'Features/FeatureGroupCard',
  component: FeatureGroupCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FeatureGroupCard>;

export const WithResolvedValues: Story = {
  args: {
    group: mockFeatureGroups[0],
    values: mockFeatureValues,
  },
};

export const WithoutValues: Story = {
  args: {
    group: mockFeatureGroups[1],
  },
};
