import { ManualDataTable } from '@granit/react-ui-kit';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { fn } from 'storybook/test';

import { catalogTranslationsEn } from '../locales';

import { createProductColumns } from './product-columns';

import type { ProductExternalMappingId, ProductId, ProductResponse } from '@granit/catalog';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';

const storyI18n = i18next.createInstance();
await storyI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: {
    en: {
      translation: {
        ...catalogTranslationsEn,
        'Common.NoResults': 'No results.',
        'Common.RowsPerPage': 'Rows per page',
        'Common.Previous': 'Previous',
        'Common.Next': 'Next',
      },
    },
  },
  interpolation: { escapeValue: false },
});

function StoryProviders({ children }: { readonly children: ReactNode }) {
  return <I18nextProvider i18n={storyI18n}>{children}</I18nextProvider>;
}

const products: ProductResponse[] = [
  {
    id: 'prod-1' as ProductId,
    sku: 'BASIC-MONTHLY',
    name: 'Basic plan',
    description: null,
    type: 'Service',
    unit: 'month',
    lifecycleStatus: 'Draft',
    metadata: {},
    externalMappings: [],
  },
  {
    id: 'prod-2' as ProductId,
    sku: 'PRO-YEARLY',
    name: 'Pro plan',
    description: null,
    type: 'Service',
    unit: 'year',
    lifecycleStatus: 'Published',
    metadata: {},
    externalMappings: [
      {
        id: 'map-1' as ProductExternalMappingId,
        providerName: 'Stripe',
        externalId: 'price_1Q0abc',
      },
    ],
  },
];

function ProductColumnsTable({ onOpen }: { readonly onOpen: (product: ProductResponse) => void }) {
  const t = storyI18n.t.bind(storyI18n) as unknown as TFunction;
  const columns = createProductColumns({ t, onOpen });
  return (
    <ManualDataTable
      columns={columns}
      data={products}
      totalCount={products.length}
      page={1}
      pageSize={25}
      pageSizes={[25, 50]}
      onPageChange={fn()}
      onPageSizeChange={fn()}
      hidePaginationOnSinglePage
      data-slot="catalog-products-table"
    />
  );
}

const meta: Meta<typeof ProductColumnsTable> = {
  title: 'Catalog/ProductColumns',
  component: ProductColumnsTable,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { onOpen: fn() },
  decorators: [
    (Story) => (
      <StoryProviders>
        <Story />
      </StoryProviders>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
