import { sampleParty } from '@granit/react-parties/testing';
import { fn } from 'storybook/test';

import { partiesMswParameters, withPartiesProvider } from '../story-decorators';

import { AddExternalMappingDialog } from './add-external-mapping-dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof AddExternalMappingDialog> = {
  title: 'Features/Parties/Dialogs/AddExternalMappingDialog',
  component: AddExternalMappingDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered', ...partiesMswParameters },
  decorators: [withPartiesProvider],
  args: { partyId: sampleParty.id, open: true, onOpenChange: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
