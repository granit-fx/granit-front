import { sampleParty } from '@granit/react-parties/testing';

import { RolesTab } from './roles-tab';
import { partiesMswParameters, withPartiesProvider } from './story-decorators';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof RolesTab> = {
  title: 'Features/Parties/Tabs/RolesTab',
  component: RolesTab,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...partiesMswParameters },
  decorators: [withPartiesProvider],
  args: { partyId: sampleParty.id },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const MultipleRoles: Story = {
  args: { roles: 'Customer, Supplier' },
};

export const NoRoles: Story = {
  args: { roles: 'None' },
};
