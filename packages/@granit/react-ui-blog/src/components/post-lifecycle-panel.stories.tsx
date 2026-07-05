import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { BlogProvider } from '@granit/react-blog';
import { BLOG_SITE_ID, createBlogAdminHandlers, mockPosts } from '@granit/react-blog/testing';
import { toISODateString } from '@granit/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { blogTranslationsEn } from '../locales';

import { PostLifecyclePanel } from './post-lifecycle-panel';

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

const meta: Meta<typeof PostLifecyclePanel> = {
  title: 'Blog/PostLifecyclePanel',
  component: PostLifecyclePanel,
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
              <Story />
            </BlogProvider>
          </QueryClientProvider>
        </GranitClientProvider>
      </I18nextProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** A post with no pending schedule — publish now or schedule. */
export const NotScheduled: Story = {};

/** A post already scheduled for a future publication instant. */
export const Scheduled: Story = {
  args: {
    post: {
      ...mockPosts[0]!,
      siteId: BLOG_SITE_ID,
      scheduledAtUtc: toISODateString('2026-08-01T09:00:00Z'),
    },
  },
};
