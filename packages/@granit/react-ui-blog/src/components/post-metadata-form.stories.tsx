import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { BlogProvider } from '@granit/react-blog';
import {
  BLOG_SITE_ID,
  createBlogAdminHandlers,
  createBlogAuthorsHandlers,
  mockPosts,
} from '@granit/react-blog/testing';
import { DocumentsProvider } from '@granit/react-documents';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { blogTranslationsEn } from '../locales';

import { PostMetadataForm } from './post-metadata-form';

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

const meta: Meta<typeof PostMetadataForm> = {
  title: 'Blog/PostMetadataForm',
  component: PostMetadataForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [...createBlogAdminHandlers(BLOG_BASE), ...createBlogAuthorsHandlers(BLOG_BASE)],
    },
  },
  args: { siteId: BLOG_SITE_ID, onSaved: () => undefined, onCancel: () => undefined },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <GranitClientProvider client={client}>
          <QueryClientProvider client={queryClient}>
            <BlogProvider config={{ client, basePath: BLOG_BASE }}>
              <DocumentsProvider config={{ client, basePath: '/api/documents' }}>
                <Story />
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

/** Create a new post shell — slug, author picker and cover image. */
export const Create: Story = {};

/** Edit an existing post's metadata (concurrency stamp echoed on save). */
export const Edit: Story = { args: { post: mockPosts[0] } };
