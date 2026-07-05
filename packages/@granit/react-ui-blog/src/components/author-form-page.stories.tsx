import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { BlogProvider } from '@granit/react-blog';
import { BLOG_SITE_ID, createBlogAuthorsHandlers } from '@granit/react-blog/testing';
import { DocumentsProvider } from '@granit/react-documents';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { blogTranslationsEn } from '../locales';

import { AuthorFormPage } from './author-form-page';

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
const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const meta: Meta<typeof AuthorFormPage> = {
  title: 'Blog/AuthorFormPage',
  component: AuthorFormPage,
  tags: ['autodocs'],
  parameters: { msw: { handlers: createBlogAuthorsHandlers(BLOG_BASE) } },
  args: { siteId: BLOG_SITE_ID, onDone: () => undefined, onCancel: () => undefined },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <GranitClientProvider client={client}>
          <QueryClientProvider client={queryClient}>
            <BlogProvider config={{ client, basePath: BLOG_BASE }}>
              <DocumentsProvider config={{ client, basePath: '/api/documents' }}>
                <div className="max-w-2xl p-6">
                  <Story />
                </div>
              </DocumentsProvider>
            </BlogProvider>
          </QueryClientProvider>
        </GranitClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Create a new author profile. */
export const Create: Story = {};

/** Edit an existing author profile. */
export const Edit: Story = { args: { authorId: 'author-1' } };
