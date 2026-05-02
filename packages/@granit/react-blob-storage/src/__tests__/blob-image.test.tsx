import { GranitClientProvider } from '@granit/react-api-client';
import { fireEvent, render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { BlobImage } from '../components/blob-image.js';

import type { ReactNode } from 'react';

function makeWrapper() {
  const apiClient = axios.create({ baseURL: 'http://localhost' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <GranitClientProvider client={apiClient}>{children}</GranitClientProvider>
  );
  return { wrapper };
}

describe('BlobImage', () => {
  it('builds the default BFF download URL from the axios client baseURL', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobImage blobId="parties/avatars/acme.jpg" alt="ACME" />
      </Wrapper>
    );
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(
      'http://localhost/api/v1/blob-storage/blobs/parties%2Favatars%2Facme.jpg/download'
    );
    expect(img.getAttribute('alt')).toBe('ACME');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('renders fallback when blobId is null', () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobImage blobId={null} fallback={<span data-testid="fallback">none</span>} />
      </Wrapper>
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-testid="fallback"]')?.textContent).toBe('none');
  });

  it('renders fallback when blobId is undefined', () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobImage blobId={undefined} fallback={<span data-testid="fallback" />} />
      </Wrapper>
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-testid="fallback"]')).not.toBeNull();
  });

  it('renders nothing when blobId is null and no fallback is supplied', () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobImage blobId={null} />
      </Wrapper>
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.firstElementChild).toBeNull();
  });

  it('uses a sync resolveUrl override', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobImage blobId="abc" resolveUrl={(id) => `https://cdn.example.com/${id}.jpg`} />
      </Wrapper>
    );
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'https://cdn.example.com/abc.jpg'
    );
  });

  it('awaits an async resolveUrl override (presigned URL flow)', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const resolveUrl = vi.fn((id: string) =>
      Promise.resolve(`https://presigned.example.com/${id}?sig=abc123`)
    );
    const { container } = render(
      <Wrapper>
        <BlobImage blobId="document.pdf" resolveUrl={resolveUrl} />
      </Wrapper>
    );
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'https://presigned.example.com/document.pdf?sig=abc123'
    );
    expect(resolveUrl).toHaveBeenCalledWith('document.pdf');
  });

  it('swaps to fallback when the underlying <img> fires onError', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container, getByTestId } = render(
      <Wrapper>
        <BlobImage blobId="missing.jpg" fallback={<span data-testid="fallback" />} />
      </Wrapper>
    );
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    const img = container.querySelector('img') as HTMLImageElement;
    fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
    expect(getByTestId('fallback')).not.toBeNull();
  });

  it('forwards arbitrary <img> attributes (className, alt, width)', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobImage
          blobId="x"
          className="rounded-full size-10"
          alt="avatar"
          width={40}
          height={40}
        />
      </Wrapper>
    );
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.className).toBe('rounded-full size-10');
    expect(img.getAttribute('alt')).toBe('avatar');
    expect(img.getAttribute('width')).toBe('40');
    expect(img.getAttribute('height')).toBe('40');
  });

  it('honours a custom basePath when resolveUrl is omitted', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobImage blobId="abc" basePath="/api/v2/storage" />
      </Wrapper>
    );
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'http://localhost/api/v2/storage/blobs/abc/download'
    );
  });

  it('forwards onError after swapping to fallback', async () => {
    const onError = vi.fn();
    const { wrapper: Wrapper } = makeWrapper();
    const { container } = render(
      <Wrapper>
        <BlobImage blobId="x" onError={onError} fallback={<span data-testid="fallback" />} />
      </Wrapper>
    );
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    expect(onError).toHaveBeenCalledOnce();
  });

  it('clears the error state when blobId changes', async () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { container, rerender } = render(
      <Wrapper>
        <BlobImage blobId="missing" fallback={<span data-testid="fallback" />} />
      </Wrapper>
    );
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    expect(container.querySelector('img')).toBeNull();
    // Switch to a fresh blobId — should reset errored state and try again.
    rerender(
      <Wrapper>
        <BlobImage blobId="next" fallback={<span data-testid="fallback" />} />
      </Wrapper>
    );
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    expect(container.querySelector('img')?.getAttribute('src')).toContain('next');
  });
});
