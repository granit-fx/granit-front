import { MappingConfidenceBadge } from './mapping-confidence-badge';

import type { MappingConfidence } from '@granit/data-exchange';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'DataExchange/MappingConfidenceBadge',
  component: MappingConfidenceBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof MappingConfidenceBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    confidence: 'Exact',
  },
};

export const Manual: Story = {
  args: {
    confidence: 'Manual' satisfies MappingConfidence,
  },
};

export const Saved: Story = {
  args: {
    confidence: 'Saved' satisfies MappingConfidence,
  },
};

export const Fuzzy: Story = {
  args: {
    confidence: 'Fuzzy' satisfies MappingConfidence,
  },
};

export const Semantic: Story = {
  args: {
    confidence: 'Semantic' satisfies MappingConfidence,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(['Manual', 'Saved', 'Exact', 'Fuzzy', 'Semantic'] as MappingConfidence[]).map(
        (confidence) => (
          <MappingConfidenceBadge key={confidence} confidence={confidence} />
        )
      )}
    </div>
  ),
};
