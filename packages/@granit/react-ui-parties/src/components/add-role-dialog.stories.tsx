import { sampleParty } from '@granit/react-parties/testing';
import { fn } from 'storybook/test';

import { PARTY_ASSIGNABLE_ROLES } from '../constants';

import { AddRoleDialog } from './add-role-dialog';
import { partiesMswParameters, withPartiesProvider } from './story-decorators';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof AddRoleDialog> = {
  title: 'Features/Parties/Dialogs/AddRoleDialog',
  component: AddRoleDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered', ...partiesMswParameters },
  decorators: [withPartiesProvider],
  args: {
    partyId: sampleParty.id,
    assignableRoles: PARTY_ASSIGNABLE_ROLES,
    open: true,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
