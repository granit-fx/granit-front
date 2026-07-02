import { createApiClient } from '@granit/api-client';
import { BlobStorageProvider } from '@granit/react-blob-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';

import { FileUploadField } from './file-upload-field';

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
    const blobId = `docs/mock-${body.fileName}`;
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
      verifiedContentType: 'application/pdf',
      sizeBytes: 1024,
      rejectionReason: null,
    };
    return HttpResponse.json(response);
  }),
];

function Wrapper({ children }: { readonly children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BlobStorageProvider config={{ client }}>
        <div className="w-80 p-4">{children}</div>
      </BlobStorageProvider>
    </QueryClientProvider>
  );
}

const meta: Meta<typeof FileUploadField> = {
  title: 'Features/BlobStorage/FileUploadField',
  component: FileUploadField,
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
    containerName: 'documents',
    onChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty state — click "Choose file" to pick and upload a file. */
export const Default: Story = {
  args: { value: null },
};

/** Pre-existing value from a saved form (filename not available — shows generic label). */
export const WithValue: Story = {
  args: { value: 'docs/existing-report.pdf' },
};

/** Restricted to PDF and Word documents via the `accept` prop. */
export const WithAccept: Story = {
  args: {
    value: null,
    accept: '.pdf,.doc,.docx',
  },
};

/** Client-side size validation — tries to upload a file over 2 MB will show an error. */
export const WithMaxSize: Story = {
  args: {
    value: null,
    maxSizeBytes: 2 * 1024 * 1024,
  },
};

/** Disabled — neither the picker nor the clear button can be activated. */
export const Disabled: Story = {
  args: {
    value: 'docs/locked-file.pdf',
    disabled: true,
  },
};

function ControlledStory(args: React.ComponentProps<typeof FileUploadField>) {
  const [blobId, setBlobId] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <FileUploadField {...args} value={blobId} onChange={setBlobId} />
      {blobId && (
        <p className="text-xs text-muted-foreground">
          Blob ID: <code>{blobId}</code>
        </p>
      )}
    </div>
  );
}

/** Controlled — blobId is surfaced above the field after upload. */
export const Controlled: Story = {
  render: (args) => <ControlledStory {...args} />,
  args: { value: null },
};
