import { sampleParty } from '@granit/react-parties/testing';

import { EmailsTab } from './emails-tab';
import { partiesMswParameters, withPartiesProvider } from './story-decorators';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof EmailsTab> = {
  title: 'Features/Parties/Tabs/EmailsTab',
  component: EmailsTab,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...partiesMswParameters },
  decorators: [withPartiesProvider],
  args: { partyId: sampleParty.id },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithEmails: Story = {
  args: { emails: sampleParty.emails },
};

export const Empty: Story = {
  args: { emails: [] },
};
