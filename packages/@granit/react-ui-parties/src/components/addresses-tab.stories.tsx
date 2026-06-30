import { sampleParty } from '@granit/react-parties/testing';

import { partiesMswParameters, withPartiesProvider } from '../story-decorators';

import { AddressesTab } from './addresses-tab';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof AddressesTab> = {
  title: 'Features/Parties/Tabs/AddressesTab',
  component: AddressesTab,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...partiesMswParameters },
  decorators: [withPartiesProvider],
  args: { partyId: sampleParty.id },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithAddresses: Story = {
  args: { addresses: sampleParty.addresses },
};

export const Empty: Story = {
  args: { addresses: [] },
};
