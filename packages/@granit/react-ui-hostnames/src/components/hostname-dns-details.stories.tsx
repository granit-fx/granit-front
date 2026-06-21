import { mockHostnames } from '@granit/react-hostnames/testing';

import { DnsDetails } from './hostname-dns-details';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof DnsDetails> = {
  title: 'Hostnames/DnsDetails',
  component: DnsDetails,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Pending hostname with expected DNS records + verification token.
export const PendingWithRecords: Story = {
  args: { hostname: mockHostnames[2] },
};

// Active hostname — certificate provisioned.
export const Active: Story = {
  args: { hostname: mockHostnames[0] },
};

// Error hostname — surfaces conflicts and failed-check count.
export const WithConflicts: Story = {
  args: { hostname: mockHostnames[3] },
};
