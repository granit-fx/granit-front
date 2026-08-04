import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { CmsProvider } from '@granit/react-cms';
import { createSitesHandlers } from '@granit/react-cms/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { http, HttpResponse } from 'msw';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import { cmsSitesTranslationsEn } from '../locales';

import { SitesListPage } from './sites-list-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const storyI18n = i18next.createInstance();
await storyI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...cmsSitesTranslationsEn } } },
  interpolation: { escapeValue: false },
});

const BASE_PATH = '/api/cms';
const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const metaHandler = http.get(`${BASE_PATH}/sites/meta`, () =>
  HttpResponse.json({
    columns: [],
    filterableFields: [],
    sortableFields: [],
    presetFilterGroups: [],
    quickFilters: [],
    dateFilters: [],
    groupByFields: [],
    pagination: {
      defaultPageSize: 20,
      maxPageSize: 100,
      maxStreamSize: 10000,
      supportsCursor: false,
    },
    defaultSort: 'slug',
  })
);

const meta: Meta<typeof SitesListPage> = {
  title: 'CMS Sites/SitesListPage',
  component: SitesListPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    // The grid is server-driven (QueryEndpointDataTable); MSW serves the
    // `/sites` list + `/sites/meta` the hooks call.
    msw: { handlers: [metaHandler, ...createSitesHandlers(`${BASE_PATH}/sites`)] },
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <GranitClientProvider client={client}>
          <QueryClientProvider client={queryClient}>
            <CmsProvider config={{ client, basePath: BASE_PATH }}>
              <MemoryRouter>
                <div className="p-6">
                  <Story />
                </div>
              </MemoryRouter>
            </CmsProvider>
          </QueryClientProvider>
        </GranitClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Sites list — server-driven grid (filter/sort/pagination) over the CMS sites endpoint. */
export const Default: Story = {};
