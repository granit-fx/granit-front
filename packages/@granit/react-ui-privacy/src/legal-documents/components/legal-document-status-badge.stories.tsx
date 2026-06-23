import { LegalDocumentStatusBadge } from './legal-document-status-badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof LegalDocumentStatusBadge> = {
  title: 'Features/Privacy/LegalDocumentStatusBadge',
  component: LegalDocumentStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['Draft', 'Published', 'Archived'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Draft: Story = { args: { status: 'Draft' } };
export const Published: Story = { args: { status: 'Published' } };
export const Archived: Story = { args: { status: 'Archived' } };

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <LegalDocumentStatusBadge status="Draft" />
      <LegalDocumentStatusBadge status="Published" />
      <LegalDocumentStatusBadge status="Archived" />
    </div>
  ),
};
