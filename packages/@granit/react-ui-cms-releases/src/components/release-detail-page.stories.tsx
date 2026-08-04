import { createApiClient } from '@granit/api-client';
import { CmsProvider } from '@granit/react-cms';
import { mockReleases } from '@granit/react-cms/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router';

import { ReleaseDetailPage } from './release-detail-page';

import type { Meta, StoryObj } from '@storybook/react-vite';

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const draftRelease = mockReleases[0]!;
const scheduledRelease = mockReleases[1]!;

function handlersFor(release: (typeof mockReleases)[number]) {
  return [
    http.get(`/api/cms/releases/${release.id}`, () => HttpResponse.json(release)),
    http.post(`/api/cms/releases/${release.id}/schedule`, () =>
      HttpResponse.json({ ...release, status: 'Ready' })
    ),
    http.post(`/api/cms/releases/${release.id}/cancel`, () =>
      HttpResponse.json({ ...release, status: 'Draft', schedule: null })
    ),
  ];
}

const meta: Meta<typeof ReleaseDetailPage> = {
  title: 'CMS Releases/ReleaseDetailPage',
  component: ReleaseDetailPage,
  tags: ['autodocs', '!test'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story, ctx) => (
      <QueryClientProvider client={queryClient}>
        <CmsProvider config={{ client, basePath: '/api/cms' }}>
          <MemoryRouter
            initialEntries={[
              `/cms/sites/${draftRelease.siteId}/releases/${ctx.parameters.releaseId}`,
            ]}
          >
            <Routes>
              <Route path="/cms/sites/:id/releases/:releaseId" element={<Story />} />
            </Routes>
          </MemoryRouter>
        </CmsProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ReleaseDetailPage>;

/** A draft release: unscheduled, with one pending publish action. */
export const Draft: Story = {
  parameters: {
    releaseId: draftRelease.id,
    msw: { handlers: handlersFor(draftRelease) },
  },
};

/** A scheduled (Ready) release showing its schedule and reschedule/cancel controls. */
export const Scheduled: Story = {
  parameters: {
    releaseId: scheduledRelease.id,
    msw: { handlers: handlersFor(scheduledRelease) },
  },
};
