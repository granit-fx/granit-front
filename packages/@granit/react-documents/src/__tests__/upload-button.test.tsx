import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UploadButton } from '../components/upload-button.tsx';
import { DocumentsProvider } from '../providers/documents-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const qc = createTestQueryClient();
    return (
      <QueryClientProvider client={qc}>
        <DocumentsProvider config={{ client }}>{children}</DocumentsProvider>
      </QueryClientProvider>
    );
  };
}

interface MockXhr {
  open: (method: string, url: string) => void;
  setRequestHeader: (key: string, value: string) => void;
  send: (body: unknown) => void;
  upload: { onprogress: ((event: ProgressEvent) => void) | null };
  onload: (() => void) | null;
  onerror: (() => void) | null;
  status: number;
}

describe('UploadButton', () => {
  let xhrInstances: MockXhr[];
  let OriginalXhr: typeof XMLHttpRequest;

  beforeEach(() => {
    xhrInstances = [];
    OriginalXhr = globalThis.XMLHttpRequest;
    class FakeXhr implements MockXhr {
      open = vi.fn();
      setRequestHeader = vi.fn();
      upload: MockXhr['upload'] = { onprogress: null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      status = 0;
      send = vi.fn(() => {
        queueMicrotask(() => {
          this.status = 200;
          this.onload?.();
        });
      });
      constructor() {
        xhrInstances.push(this);
      }
    }
    (globalThis as { XMLHttpRequest: typeof XMLHttpRequest }).XMLHttpRequest =
      FakeXhr as unknown as typeof XMLHttpRequest;
  });

  afterEach(() => {
    globalThis.XMLHttpRequest = OriginalXhr;
    vi.restoreAllMocks();
  });

  it('renders the upload button', () => {
    const client = createMockClient();
    render(<UploadButton folderId="fld-1" />, { wrapper: createWrapper(client) });
    expect(screen.getByText('Upload')).toBeInTheDocument();
  });

  it('runs the upload flow: ticket → blob PUT → finalize → onComplete', async () => {
    const client = createMockClient();
    const ticket = {
      blobId: 'blob-1',
      uploadUrl: 'https://blob.example/put',
      httpMethod: 'PUT',
      expiresAt: '2026-05-12T00:00:00Z',
      requiredHeaders: { 'x-ms-blob-type': 'BlockBlob' },
    };
    const documentResponse = {
      id: 'doc-1',
      folderId: 'fld-1',
      name: 'sample.txt',
      description: null,
      ownerId: 'user-1',
      currentVersionId: 'ver-1',
      concurrencyStamp: 'stamp-1',
      status: 'Active' as const,
      trashedAt: null,
      permission: null,
    };
    vi.mocked(client.post).mockImplementation(((url: string) => {
      if (url.endsWith('/upload-ticket')) {
        return Promise.resolve({ data: ticket });
      }
      return Promise.resolve({ data: documentResponse });
    }) as AxiosInstance['post']);

    const onComplete = vi.fn();
    render(<UploadButton folderId="fld-1" onComplete={onComplete} />, {
      wrapper: createWrapper(client),
    });

    const input = screen.getByText('Upload').previousSibling as HTMLInputElement;
    const file = new File(['hello'], 'sample.txt', { type: 'text/plain' });
    await userEvent.upload(input, file);

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(onComplete.mock.calls[0]?.[0]).toEqual(documentResponse);
    expect(xhrInstances).toHaveLength(1);
    expect(xhrInstances[0]?.open).toHaveBeenCalledWith('PUT', ticket.uploadUrl);
  });

  it('surfaces the TooLarge label when the file exceeds maxAllowedBytes', async () => {
    const client = createMockClient();
    render(<UploadButton folderId="fld-1" maxAllowedBytes={1} />, {
      wrapper: createWrapper(client),
    });

    const input = screen.getByText('Upload').previousSibling as HTMLInputElement;
    const file = new File(['hello world'], 'big.txt', { type: 'text/plain' });
    await userEvent.upload(input, file);

    await waitFor(() => expect(screen.getByText('File is too large.')).toBeInTheDocument());
  });

  it('surfaces the QuotaExceeded label when finalize returns 413', async () => {
    const client = createMockClient();
    const ticket = {
      blobId: 'blob-1',
      uploadUrl: 'https://blob.example/put',
      httpMethod: 'PUT',
      expiresAt: '2026-05-12T00:00:00Z',
      requiredHeaders: {},
    };
    vi.mocked(client.post).mockImplementation(((url: string) => {
      if (url.endsWith('/upload-ticket')) {
        return Promise.resolve({ data: ticket });
      }
      return Promise.reject({ response: { status: 413 } });
    }) as AxiosInstance['post']);

    render(<UploadButton folderId="fld-1" />, { wrapper: createWrapper(client) });
    const input = screen.getByText('Upload').previousSibling as HTMLInputElement;
    const file = new File(['hello'], 'sample.txt', { type: 'text/plain' });
    await userEvent.upload(input, file);

    await waitFor(() =>
      expect(screen.getByText('Tenant storage quota exceeded.')).toBeInTheDocument()
    );
  });

  it('surfaces a generic Error.message when the upload throws an Error', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Boom ticket'));

    render(<UploadButton folderId="fld-1" />, { wrapper: createWrapper(client) });
    const input = screen.getByText('Upload').previousSibling as HTMLInputElement;
    const file = new File(['hello'], 'sample.txt', { type: 'text/plain' });
    await userEvent.upload(input, file);

    await waitFor(() => expect(screen.getByText('Boom ticket')).toBeInTheDocument());
  });

  it('falls back to the Failed label when a non-Error is thrown', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue('weird throw');

    render(<UploadButton folderId="fld-1" labels={{ failed: 'It broke.' }} />, {
      wrapper: createWrapper(client),
    });
    const input = screen.getByText('Upload').previousSibling as HTMLInputElement;
    const file = new File(['hello'], 'sample.txt', { type: 'text/plain' });
    await userEvent.upload(input, file);

    await waitFor(() => expect(screen.getByText('It broke.')).toBeInTheDocument());
  });

  it('falls back to the Failed label when an Error has no message', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error(''));

    render(<UploadButton folderId="fld-1" />, { wrapper: createWrapper(client) });
    const input = screen.getByText('Upload').previousSibling as HTMLInputElement;
    const file = new File(['hello'], 'sample.txt', { type: 'text/plain' });
    await userEvent.upload(input, file);

    await waitFor(() => expect(screen.getByText('Upload failed.')).toBeInTheDocument());
  });

  it('handles xhr.onerror by surfacing the failed label', async () => {
    const client = createMockClient();
    const ticket = {
      blobId: 'blob-1',
      uploadUrl: 'https://blob.example/put',
      httpMethod: 'PUT',
      expiresAt: '2026-05-12T00:00:00Z',
      requiredHeaders: {},
    };
    vi.mocked(client.post).mockResolvedValue({ data: ticket });

    // Override XHR for this test to trigger onerror instead of onload.
    class ErrXhr {
      open = vi.fn();
      setRequestHeader = vi.fn();
      upload = { onprogress: null as ((event: ProgressEvent) => void) | null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      status = 0;
      send = vi.fn(() => {
        queueMicrotask(() => this.onerror?.());
      });
    }
    (globalThis as { XMLHttpRequest: typeof XMLHttpRequest }).XMLHttpRequest =
      ErrXhr as unknown as typeof XMLHttpRequest;

    render(<UploadButton folderId="fld-1" />, { wrapper: createWrapper(client) });
    const input = screen.getByText('Upload').previousSibling as HTMLInputElement;
    const file = new File(['hello'], 'sample.txt', { type: 'text/plain' });
    await userEvent.upload(input, file);

    await waitFor(() => expect(screen.getByText('Upload failed.')).toBeInTheDocument());
  });

  it('handles xhr non-2xx onload by surfacing the http error', async () => {
    const client = createMockClient();
    const ticket = {
      blobId: 'blob-1',
      uploadUrl: 'https://blob.example/put',
      httpMethod: 'PUT',
      expiresAt: '2026-05-12T00:00:00Z',
      requiredHeaders: { 'x-h': 'v' },
    };
    vi.mocked(client.post).mockResolvedValue({ data: ticket });

    class BadStatusXhr {
      open = vi.fn();
      setRequestHeader = vi.fn();
      upload = { onprogress: null as ((event: ProgressEvent) => void) | null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      status = 500;
      send = vi.fn(() => {
        queueMicrotask(() => {
          // Fire upload progress with computable bytes to cover that branch
          this.upload.onprogress?.({
            lengthComputable: true,
            loaded: 50,
            total: 100,
          } as ProgressEvent);
          this.onload?.();
        });
      });
    }
    (globalThis as { XMLHttpRequest: typeof XMLHttpRequest }).XMLHttpRequest =
      BadStatusXhr as unknown as typeof XMLHttpRequest;

    render(<UploadButton folderId="fld-1" />, { wrapper: createWrapper(client) });
    const input = screen.getByText('Upload').previousSibling as HTMLInputElement;
    const file = new File(['hello'], 'sample.txt', { type: 'text/plain' });
    await userEvent.upload(input, file);

    await waitFor(() =>
      expect(screen.getByText(/Upload failed with HTTP 500/)).toBeInTheDocument()
    );
  });

  it('uses application/octet-stream when the file has no content type', async () => {
    const client = createMockClient();
    const ticket = {
      blobId: 'blob-1',
      uploadUrl: 'https://blob.example/put',
      httpMethod: 'PUT',
      expiresAt: '2026-05-12T00:00:00Z',
      requiredHeaders: {},
    };
    const documentResponse = {
      id: 'doc-1',
      folderId: null,
      name: 'noext',
      description: null,
      ownerId: 'user-1',
      currentVersionId: 'ver-1',
      concurrencyStamp: 'stamp-1',
      status: 'Active' as const,
      trashedAt: null,
      permission: null,
    };
    vi.mocked(client.post).mockImplementation(((url: string) => {
      if (url.endsWith('/upload-ticket')) {
        return Promise.resolve({ data: ticket });
      }
      return Promise.resolve({ data: documentResponse });
    }) as AxiosInstance['post']);

    render(<UploadButton folderId={null} />, { wrapper: createWrapper(client) });
    const input = screen.getByText('Upload').previousSibling as HTMLInputElement;
    const file = new File(['hello'], 'noext', { type: '' });
    await userEvent.upload(input, file);

    await waitFor(() => {
      const calls = vi.mocked(client.post).mock.calls;
      const ticketCall = calls.find((c) => (c[0] as string).endsWith('/upload-ticket'));
      expect((ticketCall?.[1] as { contentType?: string } | undefined)?.contentType).toBe(
        'application/octet-stream'
      );
    });
  });
});
