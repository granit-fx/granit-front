import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { BlogProvider } from '@granit/react-blog';
import { createBlogAdminHandlers, mockPosts } from '@granit/react-blog/testing';
import { DocumentsProvider } from '@granit/react-documents';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { blogTranslationsEn } from '../locales';

import { PostGalleryEditor } from './post-gallery-editor';

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

const meta: Meta<typeof PostGalleryEditor> = {
  title: 'Blog/PostGalleryEditor',
  component: PostGalleryEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: { handlers: createBlogAdminHandlers(BLOG_BASE) },
  },
  args: { post: mockPosts[0] },
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

/** Gallery with two attachments — add, describe, reorder and remove. */
export const WithAttachments: Story = {};

/** A post with no attachments yet. */
export const Empty: Story = { args: { post: { ...mockPosts[0]!, attachments: [] } } };
