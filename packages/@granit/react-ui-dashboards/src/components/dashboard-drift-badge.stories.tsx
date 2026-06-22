import { DriftBadge } from './dashboard-drift-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof DriftBadge> = {
  title: 'Dashboards/DriftBadge',
  component: DriftBadge,
  tags: ['autodocs'],
  argTypes: {
    drift: {
      control: 'select',
      options: ['aligned', 'behind', 'ahead', 'ad-hoc', 'unknown'],
    },
    catalogVersion: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// `aligned` and `ad-hoc` intentionally render nothing (quiet happy paths).
export const Aligned: Story = { args: { drift: 'aligned', catalogVersion: null } };
export const AdHoc: Story = { args: { drift: 'ad-hoc', catalogVersion: null } };

export const Behind: Story = { args: { drift: 'behind', catalogVersion: null } };
export const BehindWithVersion: Story = { args: { drift: 'behind', catalogVersion: '2.4.0' } };
export const Ahead: Story = { args: { drift: 'ahead', catalogVersion: null } };
export const AheadWithVersion: Story = { args: { drift: 'ahead', catalogVersion: '1.9.0' } };
export const Unknown: Story = { args: { drift: 'unknown', catalogVersion: null } };

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <DriftBadge drift="behind" catalogVersion="2.4.0" />
      <DriftBadge drift="behind" catalogVersion={null} />
      <DriftBadge drift="ahead" catalogVersion="1.9.0" />
      <DriftBadge drift="ahead" catalogVersion={null} />
      <DriftBadge drift="unknown" catalogVersion={null} />
    </div>
  ),
};
