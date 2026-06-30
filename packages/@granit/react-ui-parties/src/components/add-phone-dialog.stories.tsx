import { sampleParty } from '@granit/react-parties/testing';
import { fn } from 'storybook/test';

import { AddPhoneDialog } from './add-phone-dialog';
import { partiesMswParameters, withPartiesProvider } from './story-decorators';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof AddPhoneDialog> = {
  title: 'Features/Parties/Dialogs/AddPhoneDialog',
  component: AddPhoneDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered', ...partiesMswParameters },
  decorators: [withPartiesProvider],
  args: { partyId: sampleParty.id, open: true, onOpenChange: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
