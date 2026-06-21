import { AuditCategoryBadge } from './audit-category-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof AuditCategoryBadge> = {
  title: 'Auditing/AuditCategoryBadge',
  component: AuditCategoryBadge,
  tags: ['autodocs'],
  argTypes: {
    category: {
      control: 'select',
      options: [
        'DataMutation',
        'ConfigurationChange',
        'DataAccess',
        'AccessDenied',
        'PrivilegedAccess',
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DataMutation: Story = { args: { category: 'DataMutation' } };
export const ConfigurationChange: Story = { args: { category: 'ConfigurationChange' } };
export const AccessDenied: Story = { args: { category: 'AccessDenied' } };

export const AllCategories: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <AuditCategoryBadge category="DataMutation" />
      <AuditCategoryBadge category="ConfigurationChange" />
      <AuditCategoryBadge category="DataAccess" />
      <AuditCategoryBadge category="AccessDenied" />
      <AuditCategoryBadge category="PrivilegedAccess" />
    </div>
  ),
};
