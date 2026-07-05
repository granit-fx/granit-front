import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { BlogProvider } from '@granit/react-blog';
import {
  BLOG_SITE_ID,
  createBlogAdminHandlers,
  createBlogAuthorsHandlers,
} from '@granit/react-blog/testing';
import { CmsProvider } from '@granit/react-cms';
import { DocumentsProvider } from '@granit/react-documents';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { blogTranslationsEn } from '../locales';

import { PostEditorPage } from './post-editor-page';

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

const meta: Meta<typeof PostEditorPage> = {
  title: 'Blog/PostEditorPage',
  component: PostEditorPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: [...createBlogAdminHandlers(BLOG_BASE), ...createBlogAuthorsHandlers(BLOG_BASE)],
    },
  },
  args: { siteId: BLOG_SITE_ID, onBack: () => undefined, onSaved: () => undefined },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={storyI18n}>
        <GranitClientProvider client={client}>
          <QueryClientProvider client={queryClient}>
            <BlogProvider config={{ client, basePath: BLOG_BASE }}>
              <CmsProvider config={{ client, basePath: '/api/cms' }}>
                <DocumentsProvider config={{ client, basePath: '/api/documents' }}>
                  <div className="p-6">
                    <Story />
                  </div>
                </DocumentsProvider>
              </CmsProvider>
            </BlogProvider>
          </QueryClientProvider>
        </GranitClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** New post — metadata form (author picker, cover). Content/media/lifecycle appear after creation. */
export const Create: Story = {};

/** Editing an existing post — metadata / content / media / lifecycle tabs. */
export const Edit: Story = { args: { postId: 'post-1' } };
