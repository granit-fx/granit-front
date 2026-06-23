import { UserTable } from './user-table';

import type { AdminUser } from '../types';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof UserTable> = {
  title: 'Identity/UserTable',
  component: UserTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    loading: { control: 'boolean' },
    onViewDetails: { action: 'onViewDetails' },
  },
};

export default meta;
type Story = StoryObj<typeof UserTable>;

const mockUsers: AdminUser[] = [
  {
    userId: 'u-001',
    email: 'alice.martin@granit-showcase.dev',
    firstName: 'Alice',
    lastName: 'Martin',
    username: 'alice.martin',
    enabled: true,
  },
  {
    userId: 'u-002',
    email: 'bob.dupont@granit-showcase.dev',
    firstName: 'Bob',
    lastName: 'Dupont',
    username: 'bob.dupont',
    enabled: true,
  },
  {
    userId: 'u-003',
    email: 'claire.bernard@granit-showcase.dev',
    firstName: 'Claire',
    lastName: 'Bernard',
    username: 'claire.bernard',
    enabled: false,
  },
  {
    userId: 'u-004',
    email: 'david.leroy@granit-showcase.dev',
    firstName: 'David',
    lastName: 'Leroy',
    username: 'david.leroy',
    enabled: true,
  },
];

export const Default: Story = {
  args: {
    users: mockUsers,
    loading: false,
    onViewDetails: () => {},
  },
};

export const Loading: Story = {
  args: {
    users: [],
    loading: true,
    onViewDetails: () => {},
  },
};

export const Empty: Story = {
  args: {
    users: [],
    loading: false,
    onViewDetails: () => {},
  },
};

export const SingleUser: Story = {
  args: {
    users: [mockUsers[0]],
    loading: false,
    onViewDetails: () => {},
  },
};
