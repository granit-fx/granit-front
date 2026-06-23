import type { Meta, StoryObj } from '@storybook/react-vite';

import { CollectionSectionCard } from './collection-section-card';

import type { EntityCollectionSectionManifest } from './manifest-extensions';

// Invoice line-items section: amount columns formatted via the `money`
// component (minor units → currency) with a `Sum` footer over `total`.
const lineItemsSection: EntityCollectionSectionManifest = {
  key: 'lineItems',
  labelKey: null,
  order: 0,
  propertyName: 'lineItems',
  currencyProperty: 'currency',
  columns: [
    { propertyName: 'description', labelKey: null, align: 'left' },
    { propertyName: 'quantity', labelKey: null, align: 'right' },
    { propertyName: 'unitPrice', labelKey: null, component: 'money', align: 'right' },
    { propertyName: 'total', labelKey: null, component: 'money', align: 'right' },
  ],
  footer: { aggregate: 'Sum', propertyName: 'total', component: 'money', labelKey: null },
};

const invoiceValues: Readonly<Record<string, unknown>> = {
  currency: 'EUR',
  lineItems: [
    {
      id: '1',
      description: 'Consulting — design phase',
      quantity: 10,
      unitPrice: 12000,
      total: 120000,
    },
    { id: '2', description: 'Implementation', quantity: 24, unitPrice: 9500, total: 228000 },
    { id: '3', description: 'Support retainer', quantity: 1, unitPrice: 50000, total: 50000 },
  ],
};

// Party contact section: link components (email / tel / url) and a plain
// date column, no footer.
const contactsSection: EntityCollectionSectionManifest = {
  key: 'contacts',
  labelKey: null,
  order: 0,
  propertyName: 'contacts',
  columns: [
    { propertyName: 'name', labelKey: null, align: 'left' },
    { propertyName: 'email', labelKey: null, component: 'email', align: 'left' },
    { propertyName: 'phone', labelKey: null, component: 'tel', align: 'left' },
    { propertyName: 'website', labelKey: null, component: 'url', align: 'left' },
    { propertyName: 'addedOn', labelKey: null, component: 'date', align: 'left' },
  ],
};

const contactValues: Readonly<Record<string, unknown>> = {
  contacts: [
    {
      id: 'c1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+32 2 555 01 23',
      website: 'https://example.com',
      addedOn: '2024-03-12T09:00:00Z',
    },
    {
      id: 'c2',
      name: 'Alan Turing',
      email: 'alan@example.com',
      phone: '+44 20 7946 0958',
      website: '/parties/c2',
      addedOn: '2024-05-30T14:30:00Z',
    },
  ],
};

const meta = {
  title: 'Layout/CollectionSectionCard',
  component: CollectionSectionCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Manifest-driven child-collection section. Reads `values[section.propertyName]` as the source rows and formats each cell per `column.component` (money / date / email / tel / url), with an optional aggregate footer.',
      },
    },
  },
} satisfies Meta<typeof CollectionSectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Invoice line items: money columns + Sum footer. */
export const InvoiceLineItems: Story = {
  args: {
    section: lineItemsSection,
    values: invoiceValues,
    locale: 'en-GB',
  },
};

/** Party contacts: email / tel / url link components and a date column. */
export const ContactLinks: Story = {
  args: {
    section: contactsSection,
    values: contactValues,
    locale: 'en-GB',
  },
};

/** No rows for the property — renders the empty placeholder. */
export const Empty: Story = {
  args: {
    section: lineItemsSection,
    values: { currency: 'EUR', lineItems: [] },
    locale: 'en-GB',
  },
};
