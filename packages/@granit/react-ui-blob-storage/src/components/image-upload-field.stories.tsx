import { createApiClient } from '@granit/api-client';
import { BlobStorageProvider } from '@granit/react-blob-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';

import { ImageUploadField } from './image-upload-field';

import type { BlobConfirmUploadResponse, BlobUploadInitiateResponse } from '@granit/blob-storage';
import type { Meta, StoryObj } from '@storybook/react-vite';

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
  // BlobImage uses the download endpoint to render the image.
  http.get(`${BASE}/blobs/:id/download`, () =>
    // Serve a 1×1 transparent PNG so the preview renders in Storybook.
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

function Wrapper({ children }: { readonly children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BlobStorageProvider config={{ client }}>
        <div className="p-4">{children}</div>
      </BlobStorageProvider>
    </QueryClientProvider>
  );
}

const meta: Meta<typeof ImageUploadField> = {
  title: 'Features/BlobStorage/ImageUploadField',
  component: ImageUploadField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    msw: { handlers: uploadHandlers },
  },
  decorators: [
    (Story) => (
      <Wrapper>
        <Story />
      </Wrapper>
    ),
  ],
  args: {
    containerName: 'images',
    onChange: () => {},
    aspectRatio: '1:1',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Avatar / profile picture — 1:1 circle frame, no image set yet. */
export const Default: Story = {
  args: { value: null },
};

/** Avatar with a pre-existing blob value. */
export const WithImage: Story = {
  args: { value: 'images/avatar-mock-id' },
};

/** Wide banner (16:9 rectangle frame). */
export const LandscapeRatio: Story = {
  args: {
    value: null,
    aspectRatio: '16:9',
  },
};

/** Portrait card (3:4 rectangle frame). */
export const PortraitRatio: Story = {
  args: {
    value: null,
    aspectRatio: '3:4',
  },
};

/** Client-side size validation — 2 MB cap. */
export const WithMaxSize: Story = {
  args: {
    value: null,
    aspectRatio: '4:3',
    maxSizeBytes: 2 * 1024 * 1024,
  },
};

/** Disabled — preview is visible but no interaction is possible. */
export const Disabled: Story = {
  args: {
    value: 'images/avatar-mock-id',
    disabled: true,
  },
};

function ControlledStory(args: React.ComponentProps<typeof ImageUploadField>) {
  const [blobId, setBlobId] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <ImageUploadField {...args} value={blobId} onChange={setBlobId} />
      {blobId && (
        <p className="text-xs text-muted-foreground">
          Blob ID: <code>{blobId}</code>
        </p>
      )}
    </div>
  );
}

/** Controlled — blob ID appears below the field after upload. */
export const Controlled: Story = {
  render: (args) => <ControlledStory {...args} />,
  args: { value: null },
};
