import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { AuthorizationProvider } from '@granit/react-authorization';
import { BlogProvider } from '@granit/react-blog';
import { createBlogAdminHandlers } from '@granit/react-blog/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { http, HttpResponse } from 'msw';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { blogTranslationsEn } from '../locales';

import { PostsListPage } from './posts-list-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const storyI18n = i18next.createInstance();
await storyI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...blogTranslationsEn } } },
  interpolation: { escapeValue: false },
});

const BLOG_BASE = '/api/blog';
const AUTHZ_BASE = '/api/blog-authz';
const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const gridMetaHandler = http.get(`${BLOG_BASE}/grid/meta`, () =>
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
    defaultSort: '-createdAt',
  })
);
const permissionsHandler = http.get(`${AUTHZ_BASE}/permissions`, () =>
  HttpResponse.json(['Blog.Posts.Read', 'Blog.Posts.Manage'])
);

const meta: Meta<typeof PostsListPage> = {
  title: 'Blog/PostsListPage',
  component: PostsListPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: [gridMetaHandler, permissionsHandler, ...createBlogAdminHandlers(BLOG_BASE)] },
  },
  args: { onNewPost: () => undefined, onEditPost: () => undefined },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <GranitClientProvider client={client}>
          <QueryClientProvider client={queryClient}>
            <AuthorizationProvider config={{ client, basePath: AUTHZ_BASE }}>
              <BlogProvider config={{ client, basePath: BLOG_BASE }}>
                <div className="p-6">
                  <Story />
                </div>
              </BlogProvider>
            </AuthorizationProvider>
          </QueryClientProvider>
        </GranitClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Posts admin grid — server-driven filter/sort/pagination, permission-gated actions. */
export const Default: Story = {};
