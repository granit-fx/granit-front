import { sampleParty } from '@granit/react-parties/testing';

import { partiesMswParameters, withPartiesProvider } from '../story-decorators';

import { ExternalMappingsTab } from './external-mappings-tab';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof ExternalMappingsTab> = {
  title: 'Features/Parties/Tabs/ExternalMappingsTab',
  component: ExternalMappingsTab,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...partiesMswParameters },
  decorators: [withPartiesProvider],
  args: { partyId: sampleParty.id },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithMappings: Story = {
  args: { mappings: sampleParty.externalMappings },
};

export const Empty: Story = {
  args: { mappings: [] },
};
