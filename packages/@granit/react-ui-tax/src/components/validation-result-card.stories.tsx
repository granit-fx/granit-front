import { ValidationResultCard } from './validation-result-card';

import type { TaxValidateResponse } from '@granit/tax';
import type { Meta, StoryObj } from '@storybook/react-vite';

const valid: TaxValidateResponse = {
  isValid: true,
  companyName: 'Granit BV',
  companyAddress: 'Rue de la Loi 1, 1000 Brussels, Belgium',
  requestIdentifier: 'BE0123456789',
  validatedAt: '2026-06-20T09:15:00Z',
  source: 'VIES',
};

const meta: Meta<typeof ValidationResultCard> = {
  title: 'Tax/ValidationResultCard',
  component: ValidationResultCard,
  tags: ['autodocs'],
  args: { result: valid },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Valid: Story = {};

export const Invalid: Story = {
  args: {
    result: {
      isValid: false,
      companyName: null,
      companyAddress: null,
      requestIdentifier: 'BE9999999999',
      validatedAt: '2026-06-20T09:15:00Z',
      source: 'VIES',
    },
  },
};
