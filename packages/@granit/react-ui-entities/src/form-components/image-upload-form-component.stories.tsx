import { createApiClient } from '@granit/api-client';
import { BlobStorageProvider } from '@granit/react-blob-storage';
import { mockEntityManifest } from '@granit/react-entities/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { fn } from 'storybook/test';

import { ImageUploadFormComponent } from './image-upload-form-component';

import type { BlobConfirmUploadResponse, BlobUploadInitiateResponse } from '@granit/blob-storage';
import type { EntityFormFieldManifest } from '@granit/entities';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Providers — the wrapped ImageUploadField pulls its upload/download plumbing
// from BlobStorageProvider + React Query, and previews existing blobs through
// the download endpoint. Mirrors the ImageUploadField story harness.
// ---------------------------------------------------------------------------

const client = createApiClient({ baseURL: '' });
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const BASE = '/api/v1/blob-storage';

const uploadHandlers = [
  http.post<
    never,
    { fileName: string; contentType: string; sizeBytes: number; containerName: string }
  >(`${BASE}/blobs/upload`, async ({ request }) => {
    const body = await request.json();
    const blobId = `images/mock-${body.fileName}`;
    const response: BlobUploadInitiateResponse = {
      blobId,
      uploadUrl: `${BASE}/blobs/${encodeURIComponent(blobId)}/_mock-put`,
      httpMethod: 'PUT',
      expiresAt: '2099-01-01T00:00:00Z' as never,
      requiredHeaders: {},
    };
    return HttpResponse.json(response);
  }),
  http.put(`${BASE}/blobs/:id/_mock-put`, () => new HttpResponse(null, { status: 200 })),
  http.post(`${BASE}/blobs/:id/confirm`, ({ params }) => {
    const blobId = decodeURIComponent(params.id as string);
    const response: BlobConfirmUploadResponse = {
      blobId,
      isValid: true,
      status: 'Valid',
      verifiedContentType: 'image/png',
      sizeBytes: 204800,
      rejectionReason: null,
    };
    return HttpResponse.json(response);
  }),
  // BlobImage renders an existing value through the download endpoint.
  http.get(`${BASE}/blobs/:id/download`, () =>
    HttpResponse.arrayBuffer(
      Uint8Array.from(
        atob(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        ),
        (c) => c.codePointAt(0)!
      ).buffer,
      { headers: { 'Content-Type': 'image/png' } }
    )
  ),
];

function Wrapper({ children }: { readonly children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BlobStorageProvider config={{ client }}>
        <div className="p-4">{children}</div>
      </BlobStorageProvider>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Field manifest factory — reuses the canonical fixture field (indexed access,
// as in the sibling test) and overrides it into an `image` component field.
// ---------------------------------------------------------------------------

const baseField = mockEntityManifest.forms![0]!.sections[0]!.fields[0]!;

function field(overrides: Partial<EntityFormFieldManifest> = {}): EntityFormFieldManifest {
  return { ...baseField, propertyName: 'Avatar', component: 'image', config: null, ...overrides };
}

const meta = {
  title: 'Entities/ImageUploadFormComponent',
  component: ImageUploadFormComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    msw: { handlers: uploadHandlers },
    docs: {
      description: {
        component:
          'EntityForm field wrapper that maps an `image` field manifest onto the blob-storage `ImageUploadField` (default `images` container; optional `aspectRatio` / `maxSizeMb` from `field.config`).',
      },
    },
  },
  decorators: [
    (Story) => (
      <Wrapper>
        <Story />
      </Wrapper>
    ),
  ],
  args: {
    onChange: fn(),
    readOnly: false,
  },
} satisfies Meta<typeof ImageUploadFormComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Populated — an existing blob id renders through the preview frame. */
export const Populated: Story = {
  args: {
    field: field(),
    value: 'images/avatar-mock-id',
  },
};

/** Empty — no blob set, default `images` container and 1:1 avatar frame. */
export const Empty: Story = {
  args: {
    field: field(),
    value: null,
  },
};

/** Config-driven — 16:9 frame, `avatars` container and a 2 MB client cap. */
export const WithConfig: Story = {
  args: {
    field: field({ config: { containerName: 'avatars', aspectRatio: '16:9', maxSizeMb: 2 } }),
    value: null,
  },
};

/** Read-only — the picker and clear controls are disabled. */
export const ReadOnly: Story = {
  args: {
    field: field(),
    value: 'images/avatar-mock-id',
    readOnly: true,
  },
};
