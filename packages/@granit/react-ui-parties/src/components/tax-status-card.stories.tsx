import { sampleParty } from '@granit/react-parties/testing';

import { partiesMswParameters, withPartiesProvider } from './story-decorators';
import { TaxStatusCard } from './tax-status-card';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof TaxStatusCard> = {
  title: 'Features/Parties/TaxStatusCard',
  component: TaxStatusCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded', ...partiesMswParameters },
  decorators: [withPartiesProvider],
  args: { partyId: sampleParty.id },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: { taxStatus: { isExempt: false, reverseCharge: false, vatin: null, evidenceBlobId: null } },
};

export const Exempt: Story = {
  args: { taxStatus: { isExempt: true, reverseCharge: false, vatin: null, evidenceBlobId: null } },
};

export const ReverseCharge: Story = {
  args: {
    taxStatus: {
      isExempt: false,
      reverseCharge: true,
      vatin: 'BE0123456789',
      evidenceBlobId: null,
    },
  },
};
