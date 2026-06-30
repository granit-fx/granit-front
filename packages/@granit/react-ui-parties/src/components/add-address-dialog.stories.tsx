import { sampleParty } from '@granit/react-parties/testing';
import { fn } from 'storybook/test';

import { partiesMswParameters, withPartiesProvider } from '../story-decorators';

import { AddAddressDialog } from './add-address-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof AddAddressDialog> = {
  title: 'Features/Parties/Dialogs/AddAddressDialog',
  component: AddAddressDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered', ...partiesMswParameters },
  decorators: [withPartiesProvider],
  args: { partyId: sampleParty.id, open: true, onOpenChange: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
