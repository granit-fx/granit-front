import { InvoiceLineItems } from './invoice-line-items';

import type { InvoiceLineItemResponse } from '@granit/invoicing';
import type { Meta, StoryObj } from '@storybook/react-vite';

const lineItems: InvoiceLineItemResponse[] = [
  {
    id: 'li-1',
    description: 'Premium Subscription (monthly)',
    quantity: 1,
    unitPrice: 49.99,
    amount: 49.99,
    taxRate: 21,
    taxAmount: 10.5,
    sourceType: 'Subscription',
    sourceId: 'sub-1',
    periodStart: null,
    periodEnd: null,
  },
  {
    id: 'li-2',
    description: 'Metered usage - API calls',
    quantity: 12000,
    unitPrice: 0.001,
    amount: 12,
    taxRate: 21,
    taxAmount: 2.52,
    sourceType: 'Usage',
    sourceId: null,
    periodStart: null,
    periodEnd: null,
  },
];

const meta: Meta<typeof InvoiceLineItems> = {
  title: 'Features/Invoicing/InvoiceLineItems',
  component: InvoiceLineItems,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    currency: 'EUR',
    lineItems,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    lineItems: [],
  },
};
