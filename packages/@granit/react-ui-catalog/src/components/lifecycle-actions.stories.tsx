import { createApiClient } from '@granit/api-client';
import { CatalogProvider } from '@granit/react-catalog';
import { workflowTranslationsEn } from '@granit/react-workflow';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { catalogTranslationsEn } from '../locales';

import { LifecycleActions } from './lifecycle-actions';

import type { ProductId, ProductResponse } from '@granit/catalog';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

const storyI18n = i18next.createInstance();
void storyI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation', 'workflow'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: {
    en: {
      translation: { ...catalogTranslationsEn, 'Common.Cancel': 'Cancel' },
      workflow: workflowTranslationsEn,
    },
  },
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
          {children}
        </CatalogProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

const product: ProductResponse = {
  id: 'prod-1' as ProductId,
  sku: 'SKU-001',
  name: 'Premium Subscription',
  description: null,
  type: 'Service',
  unit: 'each',
  lifecycleStatus: 'Draft',
  metadata: {},
  externalMappings: [],
};

const meta: Meta<typeof LifecycleActions> = {
  title: 'Catalog/LifecycleActions',
  component: LifecycleActions,
  tags: ['autodocs'],
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

export const Draft: Story = {
  args: { product },
};

export const Published: Story = {
  args: {
    product: { ...product, lifecycleStatus: 'Published' },
  },
};
