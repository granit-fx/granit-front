import { createApiClient } from '@granit/api-client';
import { CmsSeoProvider } from '@granit/react-cms-seo';
import { createCmsSeoHandlers } from '@granit/react-cms-seo/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { cmsSeoTranslationsEn } from './locales';
import { SeoDashboardPage } from './seo-dashboard-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

// The page ships its own `cms:Seo.*` strings; register them into the running
// Storybook i18n instance (plus the few `cms:Common.*` keys the host owns).
i18next.addResourceBundle(
  'en',
  'translation',
  {
    ...cmsSeoTranslationsEn,
    'cms:Common.Actions': 'Actions',
    'cms:Common.Loading': 'Loading…',
    'cms:Common.Save': 'Save',
    'cms:Common.Saving': 'Saving…',
  },
  true,
  true
);

const BASE_PATH = '/api/cms/seo';
const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof SeoDashboardPage> = {
  title: 'CMS SEO/SeoDashboardPage',
  component: SeoDashboardPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    // The page does not wrap a provider; the host supplies CmsSeoProvider +
    // GranitClientProvider. MSW serves the SEO endpoints the hooks call.
    msw: { handlers: createCmsSeoHandlers(BASE_PATH) },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <CmsSeoProvider config={{ client, basePath: BASE_PATH }}>
          <MemoryRouter initialEntries={['/cms/sites/site-1/seo']}>
            <Routes>
              <Route path="/cms/sites/:id/seo" element={<Story />} />
            </Routes>
          </MemoryRouter>
        </CmsSeoProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Full SEO dashboard — defaults form, audit table, and AI-suggestion inbox tabs. */
export const Default: Story = {};
