import { createApiClient } from '@granit/api-client';
import { CatalogProvider } from '@granit/react-catalog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { catalogTranslationsEn } from '../locales';

import { ExternalMappingsManager } from './external-mappings-manager';

import type { ProductExternalMappingId, ProductId, ProductResponse } from '@granit/catalog';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

const storyI18n = i18next.createInstance();
await storyI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...catalogTranslationsEn } } },
  interpolation: { escapeValue: false },
});

const client = createApiClient({ baseURL: '' });

function StoryProviders({ children }: { readonly children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <I18nextProvider i18n={storyI18n}>
      <QueryClientProvider client={queryClient}>
        <CatalogProvider config={{ client, basePath: '/api/v1/catalog' }}>
          <div className="max-w-2xl">{children}</div>
        </CatalogProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

const product: ProductResponse = {
  id: 'prod-1' as ProductId,
  sku: 'SKU-001',
  name: 'Premium Subscription',
  description: 'Monthly premium plan',
  type: 'Service',
  unit: 'each',
  lifecycleStatus: 'Published',
  metadata: {},
  externalMappings: [
    {
      id: 'map-1' as ProductExternalMappingId,
      providerName: 'Stripe',
      externalId: 'price_1Q0abc',
    },
  ],
};

const meta: Meta<typeof ExternalMappingsManager> = {
  title: 'Catalog/ExternalMappingsManager',
  component: ExternalMappingsManager,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
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

export const WithMappings: Story = {
  args: { product },
};

export const Empty: Story = {
  args: {
    product: { ...product, externalMappings: [] },
  },
};
