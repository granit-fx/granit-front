import { sampleParty } from '@granit/react-parties/testing';

import { partiesMswParameters, withPartiesProvider } from '../story-decorators';

import { PhonesTab } from './phones-tab';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof PhonesTab> = {
  title: 'Features/Parties/Tabs/PhonesTab',
  component: PhonesTab,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...partiesMswParameters },
  decorators: [withPartiesProvider],
  args: { partyId: sampleParty.id },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPhones: Story = {
  args: { phones: sampleParty.phones },
};

export const Empty: Story = {
  args: { phones: [] },
};
