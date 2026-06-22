import { createApiClient } from '@granit/api-client';
import { CmsProvider } from '@granit/react-cms';
import { cmsKeys } from '@granit/react-cms';
import { mockSites } from '@granit/react-cms/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { cmsSitesTranslationsEn } from './locales';
import { SitesListPage } from './sites-list-page';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

const storyI18n = i18next.createInstance();
void storyI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...cmsSitesTranslationsEn } } },
  interpolation: { escapeValue: false },
});

const client = createApiClient({ baseURL: '' });
const prefix = ['cms'];

function StoryProviders({
  children,
  seed,
}: {
  readonly children: ReactNode;
  readonly seed?: readonly (typeof mockSites)[number][];
}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  if (seed) {
    queryClient.setQueryData(cmsKeys.sites.list(prefix), { items: seed, totalCount: seed.length });
  }
  return (
    <I18nextProvider i18n={storyI18n}>
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <CmsProvider config={{ client }}>{children}</CmsProvider>
        </QueryClientProvider>
      </MemoryRouter>
    </I18nextProvider>
  );
}

const meta: Meta<typeof SitesListPage> = {
  title: 'CMS Sites/SitesListPage',
  component: SitesListPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSites: Story = {
  decorators: [
    (Story) => (
      <StoryProviders seed={mockSites}>
        <div className="p-6">
          <Story />
        </div>
      </StoryProviders>
    ),
  ],
};

export const Empty: Story = {
  decorators: [
    (Story) => (
      <StoryProviders seed={[]}>
        <div className="p-6">
          <Story />
        </div>
      </StoryProviders>
    ),
  ],
};
