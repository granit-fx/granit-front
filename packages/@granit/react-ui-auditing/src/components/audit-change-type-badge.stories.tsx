import { AuditChangeTypeBadge } from './audit-change-type-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof AuditChangeTypeBadge> = {
  title: 'Auditing/AuditChangeTypeBadge',
  component: AuditChangeTypeBadge,
  tags: ['autodocs'],
  argTypes: {
    changeType: {
      control: 'select',
      options: ['Created', 'Modified', 'Deleted', 'SoftDeleted'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Created: Story = { args: { changeType: 'Created' } };
export const Modified: Story = { args: { changeType: 'Modified' } };
export const Deleted: Story = { args: { changeType: 'Deleted' } };
export const SoftDeleted: Story = { args: { changeType: 'SoftDeleted' } };

export const AllChangeTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <AuditChangeTypeBadge changeType="Created" />
      <AuditChangeTypeBadge changeType="Modified" />
      <AuditChangeTypeBadge changeType="Deleted" />
      <AuditChangeTypeBadge changeType="SoftDeleted" />
    </div>
  ),
};
