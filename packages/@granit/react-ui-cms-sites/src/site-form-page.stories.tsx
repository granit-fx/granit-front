import { createApiClient } from '@granit/api-client';
import { CmsProvider } from '@granit/react-cms';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { cmsSitesTranslationsEn } from './locales';
import { SiteFormPage } from './site-form-page';

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

function StoryProviders({ children }: { readonly children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <I18nextProvider i18n={storyI18n}>
      <MemoryRouter initialEntries={['/cms/sites/new']}>
        <QueryClientProvider client={queryClient}>
          <CmsProvider config={{ client }}>{children}</CmsProvider>
        </QueryClientProvider>
      </MemoryRouter>
    </I18nextProvider>
  );
}

const meta: Meta<typeof SiteFormPage> = {
  title: 'CMS Sites/SiteFormPage',
  component: SiteFormPage,
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

// Create mode (no route id) — the only deterministic form state in isolation.
// Edit mode resolves its site through useParams + the CMS query, which a host
// route supplies; the page test (in-package) covers the edit branch via mocks.
export const Create: Story = {};
