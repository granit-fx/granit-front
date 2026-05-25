import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UploadDropZone } from '../components/upload-drop-zone.tsx';
import { DocumentsProvider } from '../providers/documents-provider.js';

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

function makeDataTransfer(files: File[], extraTypes: readonly string[] = []): DataTransfer {
  // jsdom doesn't ship a real DataTransfer; the bits the component touches
  // are `types`, `files`, and the per-MIME `getData`/`setData` pair.
  const store = new Map<string, string>();
  const types: string[] = [
    ...(files.length > 0 ? ['Files'] : []),
    ...extraTypes.filter((t) => !(files.length > 0 && t === 'Files')),
  ];
  return {
    types,
    files: files as unknown as FileList,
    items: [] as unknown as DataTransferItemList,
    effectAllowed: 'all',
    dropEffect: 'none',
    setData: (type: string, data: string) => {
      store.set(type, data);
      if (!types.includes(type)) types.push(type);
    },
    getData: (type: string) => store.get(type) ?? '',
    clearData: () => store.clear(),
    setDragImage: vi.fn(),
  } as unknown as DataTransfer;
}

function dispatchDragEvent(target: Element, kind: string, dataTransfer: DataTransfer): void {
  const event = new Event(kind, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
  target.dispatchEvent(event);
}

describe('UploadDropZone', () => {
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

  it('shows the overlay while files are dragged over and clears it on leave', async () => {
    const client = createMockClient();
    render(
      <UploadDropZone folderId="fld-1">
        <div>main pane</div>
      </UploadDropZone>,
      { wrapper: createWrapper(client) }
    );

    const zone = document.querySelector<HTMLElement>('[data-granit-upload-drop-zone]');
    expect(zone).not.toBeNull();
    // Synthesize the `Files` type — dragenter fires before the OS reveals
    // the file list, but the type is visible from the start.
    const dt = makeDataTransfer([], ['Files']);
    dispatchDragEvent(zone!, 'dragenter', dt);

    await waitFor(() => expect(zone!.hasAttribute('data-granit-upload-drop-zone-over')).toBe(true));
    expect(screen.getByText('Drop files to upload')).toBeInTheDocument();

    dispatchDragEvent(zone!, 'dragleave', dt);

    await waitFor(() =>
      expect(zone!.hasAttribute('data-granit-upload-drop-zone-over')).toBe(false)
    );
  });

  it('ignores drags that do not carry the Files type', () => {
    const client = createMockClient();
    render(
      <UploadDropZone folderId="fld-1">
        <div>main pane</div>
      </UploadDropZone>,
      { wrapper: createWrapper(client) }
    );

    const zone = document.querySelector<HTMLElement>('[data-granit-upload-drop-zone]');
    // No 'Files' type → ignored.
    dispatchDragEvent(zone!, 'dragenter', makeDataTransfer([]));

    expect(zone!.hasAttribute('data-granit-upload-drop-zone-over')).toBe(false);
    expect(screen.queryByText('Drop files to upload')).toBeNull();
  });

  it('does nothing when disabled', () => {
    const client = createMockClient();
    render(
      <UploadDropZone folderId="fld-1" disabled>
        <div>main pane</div>
      </UploadDropZone>,
      { wrapper: createWrapper(client) }
    );

    const zone = document.querySelector<HTMLElement>('[data-granit-upload-drop-zone]');
    dispatchDragEvent(zone!, 'dragenter', makeDataTransfer([], ['Files']));

    expect(zone!.hasAttribute('data-granit-upload-drop-zone-over')).toBe(false);
  });

  it('runs the upload flow for each dropped file and fires onComplete + onBatchDone', async () => {
    const client = createMockClient();
    const ticket = {
      blobId: 'blob-1',
      uploadUrl: 'https://blob.example/put',
      httpMethod: 'PUT',
      expiresAt: '2026-05-12T00:00:00Z',
      requiredHeaders: {},
    };
    const finalized = {
      id: 'doc-1',
      folderId: 'fld-1',
      name: 'a.pdf',
      status: 'Active',
      ownerUserId: 'u',
      currentVersionId: 'v',
      description: null,
      trashedAt: null,
      permission: null,
    };
    vi.mocked(client.post).mockImplementation(((url: string) => {
      if (url.includes('upload-ticket')) {
        return Promise.resolve({ data: ticket });
      }
      if (url.includes('finalize')) {
        return Promise.resolve({ data: finalized });
      }
      return Promise.resolve({ data: undefined });
    }) as AxiosInstance['post']);

    const onComplete = vi.fn();
    const onBatchDone = vi.fn();
    render(
      <UploadDropZone folderId="fld-1" onComplete={onComplete} onBatchDone={onBatchDone}>
        <div>main pane</div>
      </UploadDropZone>,
      { wrapper: createWrapper(client) }
    );

    const zone = document.querySelector<HTMLElement>('[data-granit-upload-drop-zone]');
    const files = [
      new File(['1'], 'a.pdf', { type: 'application/pdf' }),
      new File(['2'], 'b.pdf', { type: 'application/pdf' }),
    ];
    dispatchDragEvent(zone!, 'drop', makeDataTransfer(files));

    await waitFor(() => expect(onBatchDone).toHaveBeenCalled());
    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(onBatchDone).toHaveBeenCalledWith({ succeeded: 2, failed: 0 });
    // upload-ticket + finalize per file → 4 POSTs
    expect(vi.mocked(client.post).mock.calls.length).toBe(4);
  });

  it('reports per-file failure but still counts succeeded uploads', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockImplementation(((url: string) => {
      if (url.includes('upload-ticket')) {
        return Promise.reject(new Error('boom'));
      }
      return Promise.resolve({ data: undefined });
    }) as AxiosInstance['post']);

    const onBatchDone = vi.fn();
    render(
      <UploadDropZone folderId="fld-1" onBatchDone={onBatchDone}>
        <div>main pane</div>
      </UploadDropZone>,
      { wrapper: createWrapper(client) }
    );

    const zone = document.querySelector<HTMLElement>('[data-granit-upload-drop-zone]');
    const files = [new File(['x'], 'a.pdf', { type: 'application/pdf' })];
    dispatchDragEvent(zone!, 'drop', makeDataTransfer(files));

    await waitFor(() => expect(onBatchDone).toHaveBeenCalledWith({ succeeded: 0, failed: 1 }));
    expect(screen.getByRole('alert').textContent).toMatch(/boom/i);
  });
});
