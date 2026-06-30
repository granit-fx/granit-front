import { sampleParty } from '@granit/react-parties/testing';

import { MetadataTab } from './metadata-tab';
import { partiesMswParameters, withPartiesProvider } from './story-decorators';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof MetadataTab> = {
  title: 'Features/Parties/Tabs/MetadataTab',
  component: MetadataTab,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...partiesMswParameters },
  decorators: [withPartiesProvider],
  args: { partyId: sampleParty.id },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithEntries: Story = {
  args: { metadata: sampleParty.metadata },
};

export const Empty: Story = {
  args: { metadata: {} },
};
