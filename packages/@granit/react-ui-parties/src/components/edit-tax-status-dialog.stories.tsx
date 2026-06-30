import { sampleParty } from '@granit/react-parties/testing';
import { fn } from 'storybook/test';

import { EditTaxStatusDialog } from './edit-tax-status-dialog';
import { partiesMswParameters, withPartiesProvider } from './story-decorators';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof EditTaxStatusDialog> = {
  title: 'Features/Parties/Dialogs/EditTaxStatusDialog',
  component: EditTaxStatusDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered', ...partiesMswParameters },
  decorators: [withPartiesProvider],
  args: { partyId: sampleParty.id, open: true, onOpenChange: fn() },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: {
    current: { isExempt: false, reverseCharge: false, vatin: null, evidenceBlobId: null },
  },
};

export const ReverseCharge: Story = {
  args: {
    current: { isExempt: false, reverseCharge: true, vatin: 'BE0123456789', evidenceBlobId: null },
  },
};
