import { createApiClient } from '@granit/api-client';
import { CatalogProvider } from '@granit/react-catalog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { CatalogCreatePage } from './catalog-create-page';
import { catalogTranslationsEn } from './locales';

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
  resources: {
    en: {
      translation: {
        ...catalogTranslationsEn,
        'Common.Cancel': 'Cancel',
        'Common.Create': 'Create',
      },
    },
  },
  interpolation: { escapeValue: false },
});

const client = createApiClient({ baseURL: '' });

function StoryProviders({ children }: { readonly children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <I18nextProvider i18n={storyI18n}>
      <MemoryRouter initialEntries={['/catalog/new']}>
        <QueryClientProvider client={queryClient}>
          <CatalogProvider config={{ client, basePath: '/api/v1/catalog' }}>
            {children}
          </CatalogProvider>
        </QueryClientProvider>
      </MemoryRouter>
    </I18nextProvider>
  );
}

const meta: Meta<typeof CatalogCreatePage> = {
  title: 'Catalog/CatalogCreatePage',
  component: CatalogCreatePage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <StoryProviders>
        <div className="p-6">
          <Story />
        </div>
      </StoryProviders>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
