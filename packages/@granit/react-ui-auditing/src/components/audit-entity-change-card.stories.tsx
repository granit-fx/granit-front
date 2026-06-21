import { AuditEntityChangeCard } from './audit-entity-change-card';

import type { AuditEntityChangeResponse } from '@granit/auditing';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof AuditEntityChangeCard> = {
  title: 'Auditing/AuditEntityChangeCard',
  component: AuditEntityChangeCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const modifiedChange: AuditEntityChangeResponse = {
  entityType: 'User',
  entityId: 'user-001',
  changeType: 'Modified',
  propertyChanges: [
    { propertyName: 'email', originalValue: 'old@test.com', newValue: 'new@test.com' },
    { propertyName: 'displayName', originalValue: 'Marie D.', newValue: 'Marie Dupont' },
  ],
};

const createdChange: AuditEntityChangeResponse = {
  entityType: 'Tenant',
  entityId: 'tenant-007',
  changeType: 'Created',
  propertyChanges: [{ propertyName: 'name', originalValue: null, newValue: 'Acme Corp' }],
};

export const Modified: Story = { args: { change: modifiedChange } };
export const Created: Story = { args: { change: createdChange } };
