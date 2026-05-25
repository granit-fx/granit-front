import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DocumentQuickLook } from '../components/document-quick-look.tsx';
import { DocumentsProvider } from '../providers/documents-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { DocumentResponse } from '@granit/documents';
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

function makeDocument(id: string, name: string): DocumentResponse {
  return {
    id,
    folderId: 'fld-1',
    name,
    status: 'Active',
    ownerUserId: 'u',
    currentVersionId: 'v',
    description: null,
    trashedAt: null,
    permission: null,
  };
}

function mockGet(client: AxiosInstance, routes: Record<string, unknown>, fallback?: unknown): void {
  vi.mocked(client.get).mockImplementation(((url: string) => {
    for (const [pattern, payload] of Object.entries(routes)) {
      if (url.includes(pattern)) return Promise.resolve({ data: payload });
    }
    if (fallback !== undefined) return Promise.resolve({ data: fallback });
    return Promise.reject(new Error(`No mock for ${url}`));
  }) as AxiosInstance['get']);
}

describe('DocumentQuickLook', () => {
  // jsdom doesn't implement showModal/close; shim them so the dialog effect
  // can run without crashing the test.
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not open when documentId is null', () => {
    const client = createMockClient();
    render(<DocumentQuickLook documentId={null} onClose={() => undefined} />, {
      wrapper: createWrapper(client),
    });
    const dialog = document.querySelector<HTMLDialogElement>('[data-granit-document-quick-look]');
    expect(dialog?.hasAttribute('open')).toBe(false);
  });

  it('opens and renders an image preview for an image kind', async () => {
    const client = createMockClient();
    mockGet(client, {
      '/documents/doc-1/download': { url: 'https://blob.example/photo.png' },
      '/documents/doc-1': makeDocument('doc-1', 'photo.png'),
    });

    render(<DocumentQuickLook documentId="doc-1" onClose={() => undefined} />, {
      wrapper: createWrapper(client),
    });

    const dialog = await waitFor(() =>
      document.querySelector<HTMLDialogElement>('[data-granit-document-quick-look]')
    );
    expect(dialog?.hasAttribute('open')).toBe(true);
    // Kind is computed from the document name once the docQuery resolves.
    await waitFor(() =>
      expect(dialog?.getAttribute('data-granit-document-quick-look-kind')).toBe('image')
    );

    await waitFor(() => {
      expect(document.querySelector('[data-granit-document-quick-look-image]')).not.toBeNull();
    });
  });

  it('renders an iframe for a pdf kind', async () => {
    const client = createMockClient();
    mockGet(client, {
      '/documents/doc-1/download': { url: 'https://blob.example/contract.pdf' },
      '/documents/doc-1': makeDocument('doc-1', 'contract.pdf'),
    });

    render(<DocumentQuickLook documentId="doc-1" onClose={() => undefined} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => {
      const iframe = document.querySelector<HTMLIFrameElement>(
        '[data-granit-document-quick-look-pdf]'
      );
      expect(iframe?.src).toContain('contract.pdf');
    });
  });

  it('fetches text content and renders it inline for a text kind', async () => {
    const client = createMockClient();
    const fileText = 'hello world';
    vi.mocked(client.get).mockImplementation(((url: string) => {
      if (url.includes('/documents/doc-1/download')) {
        return Promise.resolve({ data: { url: 'https://blob.example/notes.md' } });
      }
      if (url === 'https://blob.example/notes.md') {
        return Promise.resolve({ data: fileText });
      }
      if (url.includes('/documents/doc-1')) {
        return Promise.resolve({ data: makeDocument('doc-1', 'notes.md') });
      }
      return Promise.reject(new Error(`No mock for ${url}`));
    }) as AxiosInstance['get']);

    render(<DocumentQuickLook documentId="doc-1" onClose={() => undefined} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('hello world')).toBeInTheDocument());
  });

  it('renders a fallback for unsupported kinds', async () => {
    const client = createMockClient();
    mockGet(client, {
      '/documents/doc-1/download': { url: 'https://blob.example/bundle.zip' },
      '/documents/doc-1': makeDocument('doc-1', 'bundle.zip'),
    });

    render(<DocumentQuickLook documentId="doc-1" onClose={() => undefined} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() =>
      expect(screen.getByText(/No preview available for archive/i)).toBeInTheDocument()
    );
  });

  it('navigates with ← / → through siblings', async () => {
    const client = createMockClient();
    mockGet(client, {
      '/documents/doc-1/download': { url: 'https://blob.example/a.png' },
      '/documents/doc-1': makeDocument('doc-1', 'a.png'),
    });

    const onNavigate = vi.fn();
    const siblings = [
      makeDocument('doc-0', 'before.png'),
      makeDocument('doc-1', 'a.png'),
      makeDocument('doc-2', 'after.png'),
    ];
    render(
      <DocumentQuickLook
        documentId="doc-1"
        siblings={siblings}
        onNavigate={onNavigate}
        onClose={() => undefined}
      />,
      { wrapper: createWrapper(client) }
    );

    const dialog = await waitFor(() =>
      document.querySelector<HTMLDialogElement>('[data-granit-document-quick-look]')
    );
    expect(dialog).not.toBeNull();
    // Position counter "2 / 3".
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    // jsdom doesn't reliably make a <dialog> the activeElement, so we
    // dispatch keyboard events directly. The component's onKeyDown handler
    // doesn't care about focus.
    fireEvent.keyDown(dialog!, { key: 'ArrowRight' });
    expect(onNavigate).toHaveBeenCalledWith('doc-2');

    fireEvent.keyDown(dialog!, { key: 'ArrowLeft' });
    fireEvent.keyDown(dialog!, { key: 'ArrowLeft' });
    // First left → doc-0, second left clamped (already at first).
    expect(onNavigate).toHaveBeenLastCalledWith('doc-0');
  });

  it('disables the prev button at the start and next at the end of siblings', async () => {
    const client = createMockClient();
    mockGet(client, {
      '/documents/doc-0/download': { url: 'https://blob.example/start.png' },
      '/documents/doc-0': makeDocument('doc-0', 'start.png'),
    });

    const siblings = [makeDocument('doc-0', 'start.png'), makeDocument('doc-1', 'end.png')];
    render(
      <DocumentQuickLook
        documentId="doc-0"
        siblings={siblings}
        onNavigate={vi.fn()}
        onClose={vi.fn()}
      />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => screen.getByText('1 / 2'));
    const prev = document.querySelector<HTMLButtonElement>(
      '[data-granit-document-quick-look-prev]'
    );
    const next = document.querySelector<HTMLButtonElement>(
      '[data-granit-document-quick-look-next]'
    );
    expect(prev?.disabled).toBe(true);
    expect(next?.disabled).toBe(false);
  });

  it('calls onClose when the dialog dispatches a close event', async () => {
    const client = createMockClient();
    mockGet(client, {
      '/documents/doc-1/download': { url: 'https://blob.example/photo.png' },
      '/documents/doc-1': makeDocument('doc-1', 'photo.png'),
    });

    const onClose = vi.fn();
    render(<DocumentQuickLook documentId="doc-1" onClose={onClose} />, {
      wrapper: createWrapper(client),
    });

    const dialog = await waitFor(() =>
      document.querySelector<HTMLDialogElement>('[data-granit-document-quick-look]')
    );
    expect(dialog).not.toBeNull();
    dialog!.close();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
