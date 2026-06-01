import { GranitClientProvider } from '@granit/react-api-client';
import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { BlobUploadField } from '../components/blob-upload-field';
import { BlobStorageProvider } from '../providers/blob-storage-provider';

import type { ReactNode } from 'react';

let xhrInstances: MockXHR[] = [];

class MockXHR {
  status = 200;
  uploadListeners: Record<string, (e: unknown) => void> = {};
  listeners: Record<string, (e: unknown) => void> = {};
  upload = {
    addEventListener: (event: string, handler: (e: unknown) => void) => {
      this.uploadListeners[event] = handler;
    },
  };
  addEventListener = (event: string, handler: (e: unknown) => void) => {
    this.listeners[event] = handler;
  };
  open = vi.fn();
  setRequestHeader = vi.fn();
  send = vi.fn();
  abort = vi.fn();
  constructor() {
    xhrInstances.push(this);
  }
  triggerLoad() {
    this.listeners['load']?.({});
  }
}

beforeAll(() => {
  vi.stubGlobal('XMLHttpRequest', MockXHR);
});
afterAll(() => {
  vi.unstubAllGlobals();
});
beforeEach(() => {
  xhrInstances = [];
});
afterEach(() => {
  vi.restoreAllMocks();
});

function makeWrapper() {
  const queryClient = createTestQueryClient();
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  // Stub the two HTTP calls the upload flow makes (initiate + confirm) so
  // tests don't hit MSW for every render. The XHR PUT is intercepted by
  // MockXHR above.
  vi.spyOn(apiClient, 'post').mockImplementation(async (url: string) => {
    if (url.endsWith('/upload')) {
      return {
        data: {
          blobId: 'blob-uploaded-123',
          uploadUrl: 'https://s3.example.com/presigned',
          httpMethod: 'PUT',
          expiresAt: '2026-12-31T00:00:00Z',
          requiredHeaders: {},
        },
      } as unknown as Awaited<ReturnType<typeof apiClient.post>>;
    }
    if (url.includes('/confirm')) {
      return {
        data: {
          blobId: 'blob-uploaded-123',
          isValid: true,
          status: 'Valid',
          verifiedContentType: 'image/png',
          sizeBytes: 12,
          rejectionReason: null,
        },
      } as unknown as Awaited<ReturnType<typeof apiClient.post>>;
    }
    throw new Error(`Unexpected POST to ${url}`);
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={apiClient}>
        <BlobStorageProvider config={{}}>{children}</BlobStorageProvider>
      </GranitClientProvider>
    </QueryClientProvider>
  );
  return { wrapper };
}

describe('BlobUploadField', () => {
  it('renders the file input + idle data-phase when no value is set', () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobUploadField value={null} onChange={() => undefined} containerName="avatars" />
      </Wrapper>
    );
    const root = container.querySelector('[data-granit-blob-upload]') as HTMLElement;
    expect(root.getAttribute('data-phase')).toBe('idle');
    expect(root.hasAttribute('data-busy')).toBe(false);
    expect(container.querySelector('[data-granit-blob-upload-input]')).not.toBeNull();
    expect(container.querySelector('[data-granit-blob-upload-preview]')).toBeNull();
    expect(container.querySelector('[data-granit-blob-upload-clear]')).toBeNull();
  });

  it('renders <BlobImage> preview + default clear button when a value is set', () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobUploadField
          value="parties/avatars/abc.jpg"
          onChange={() => undefined}
          containerName="avatars"
        />
      </Wrapper>
    );
    const preview = container.querySelector('[data-granit-blob-upload-preview]');
    expect(preview).not.toBeNull();
    expect(preview?.querySelector('img')).not.toBeNull();
    expect(container.querySelector('[data-granit-blob-upload-clear]')).not.toBeNull();
  });

  it('clears the value when the default clear button is clicked', () => {
    const onChange = vi.fn();
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobUploadField
          value="parties/avatars/abc.jpg"
          onChange={onChange}
          containerName="avatars"
        />
      </Wrapper>
    );
    fireEvent.click(container.querySelector('[data-granit-blob-upload-clear]') as HTMLElement);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('honors the renderPreview override slot', () => {
    const { wrapper: Wrapper } = makeWrapper();
    const renderPreview = vi.fn(() => <span data-testid="custom-preview">custom</span>);
    const { container } = render(
      <Wrapper>
        <BlobUploadField
          value="parties/avatars/abc.jpg"
          onChange={() => undefined}
          containerName="avatars"
          renderPreview={renderPreview}
        />
      </Wrapper>
    );
    expect(renderPreview).toHaveBeenCalledWith(
      'parties/avatars/abc.jpg',
      expect.objectContaining({ phase: 'idle' })
    );
    expect(container.querySelector('[data-testid="custom-preview"]')).not.toBeNull();
    // Default <BlobImage> preview should NOT render alongside the override.
    expect(container.querySelector('[data-granit-blob-upload-preview] img')).toBeNull();
  });

  it('suppresses the preview entirely when renderPreview is null', () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobUploadField
          value="parties/avatars/abc.jpg"
          onChange={() => undefined}
          containerName="avatars"
          renderPreview={null}
        />
      </Wrapper>
    );
    expect(container.querySelector('[data-granit-blob-upload-preview]')).toBeNull();
  });

  it('honors the renderClear override slot', () => {
    const onChange = vi.fn();
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobUploadField
          value="parties/avatars/abc.jpg"
          onChange={onChange}
          containerName="avatars"
          renderClear={({ clear }) => (
            <button type="button" data-testid="custom-clear" onClick={clear}>
              ×
            </button>
          )}
        />
      </Wrapper>
    );
    expect(container.querySelector('[data-granit-blob-upload-clear]')).toBeNull();
    fireEvent.click(container.querySelector('[data-testid="custom-clear"]') as HTMLElement);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('disables the input + clear button when disabled is set', () => {
    const onChange = vi.fn();
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobUploadField
          value="parties/avatars/abc.jpg"
          onChange={onChange}
          containerName="avatars"
          disabled
        />
      </Wrapper>
    );
    const input = container.querySelector('[data-granit-blob-upload-input]') as HTMLInputElement;
    expect(input.disabled).toBe(true);
    const clear = container.querySelector('[data-granit-blob-upload-clear]') as HTMLButtonElement;
    expect(clear.disabled).toBe(true);
    fireEvent.click(clear);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('forwards id + name to the underlying <input>', () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobUploadField
          value={null}
          onChange={() => undefined}
          containerName="avatars"
          id="field-Avatar"
          name="Avatar"
        />
      </Wrapper>
    );
    const input = container.querySelector('[data-granit-blob-upload-input]') as HTMLInputElement;
    expect(input.id).toBe('field-Avatar');
    expect(input.name).toBe('Avatar');
  });

  it('rejects oversized files before the upload PUT fires', async () => {
    const onChange = vi.fn();
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobUploadField
          value={null}
          onChange={onChange}
          containerName="avatars"
          maxSizeBytes={100}
        />
      </Wrapper>
    );
    const input = container.querySelector('[data-granit-blob-upload-input]') as HTMLInputElement;
    const file = new File(['a'.repeat(500)], 'big.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
    await waitFor(() =>
      expect(container.querySelector('[data-granit-blob-upload-error]')).not.toBeNull()
    );
    const err = container.querySelector('[data-granit-blob-upload-error]') as HTMLElement;
    expect(err.getAttribute('data-error-kind')).toBe('validation');
    expect(err.textContent).toContain('MB');
    expect(xhrInstances.length).toBe(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('honors a custom validateFile slot and short-circuits on truthy return', async () => {
    const onChange = vi.fn();
    const validateFile = vi.fn(() => 'PNG only');
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobUploadField
          value={null}
          onChange={onChange}
          containerName="avatars"
          validateFile={validateFile}
        />
      </Wrapper>
    );
    const input = container.querySelector('[data-granit-blob-upload-input]') as HTMLInputElement;
    const file = new File(['payload'], 'avatar.gif', { type: 'image/gif' });
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
    await waitFor(() =>
      expect(container.querySelector('[data-granit-blob-upload-error]')).not.toBeNull()
    );
    expect(validateFile).toHaveBeenCalledWith(file);
    const err = container.querySelector('[data-granit-blob-upload-error]') as HTMLElement;
    expect(err.textContent).toBe('PNG only');
    expect(xhrInstances.length).toBe(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clears validation errors when the user clears the value', async () => {
    const onChange = vi.fn();
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobUploadField
          value="parties/avatars/abc.jpg"
          onChange={onChange}
          containerName="avatars"
          maxSizeBytes={100}
        />
      </Wrapper>
    );
    // Trigger the size-error first.
    const input = container.querySelector('[data-granit-blob-upload-input]') as HTMLInputElement;
    const file = new File(['a'.repeat(500)], 'big.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
    await waitFor(() =>
      expect(container.querySelector('[data-granit-blob-upload-error]')).not.toBeNull()
    );
    // Click clear → error should disappear.
    fireEvent.click(container.querySelector('[data-granit-blob-upload-clear]') as HTMLElement);
    expect(container.querySelector('[data-granit-blob-upload-error]')).toBeNull();
  });

  it('runs the upload flow on file pick and reports the new blobId via onChange', async () => {
    const onChange = vi.fn();
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobUploadField value={null} onChange={onChange} containerName="avatars" />
      </Wrapper>
    );
    const input = container.querySelector('[data-granit-blob-upload-input]') as HTMLInputElement;
    const file = new File(['hello'], 'avatar.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    // Wait for the XHR to be issued by useBlobUpload's middle step.
    await waitFor(() => expect(xhrInstances.length).toBe(1));
    xhrInstances[0]?.triggerLoad();

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('blob-uploaded-123'));
  });
});
