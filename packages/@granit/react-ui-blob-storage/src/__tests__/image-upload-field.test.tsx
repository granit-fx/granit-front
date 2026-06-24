import { screen } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ImageUploadField } from '../components/image-upload-field';

import { renderWithProviders } from './test-utils';

import type { BlobUploadState, UseBlobUploadReturn } from '@granit/react-blob-storage';

const IDLE_STATE: BlobUploadState = {
  phase: 'idle',
  progress: 0,
  blobId: null,
  result: null,
  error: null,
};

const mockUpload = vi.fn();
const mockReset = vi.fn();

vi.mock('@granit/react-blob-storage', () => ({
  useBlobUpload: vi.fn(
    (): UseBlobUploadReturn => ({
      upload: mockUpload,
      state: IDLE_STATE,
      reset: mockReset,
    })
  ),
  BlobImage: ({
    blobId,
    fallback,
    className,
  }: {
    blobId: string | null | undefined;
    fallback?: React.ReactNode;
    className?: string;
  }) => (blobId ? <img data-testid="blob-image" alt="" className={className} /> : <>{fallback}</>),
}));

const { useBlobUpload } = await import('@granit/react-blob-storage');

beforeEach(() => {
  vi.mocked(useBlobUpload).mockReturnValue({
    upload: mockUpload,
    state: IDLE_STATE,
    reset: mockReset,
  });
  vi.clearAllMocks();
});

describe('ImageUploadField', () => {
  it('renders the upload button when no value is set', () => {
    renderWithProviders(
      <ImageUploadField value={null} onChange={vi.fn()} containerName="images" />
    );
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove image/i })).not.toBeInTheDocument();
  });

  it('renders the replace button and clear button when a value is set', () => {
    renderWithProviders(
      <ImageUploadField value="blob-123" onChange={vi.fn()} containerName="images" />
    );
    expect(screen.getByRole('button', { name: /replace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove image/i })).toBeInTheDocument();
  });

  it('renders BlobImage when value is set', () => {
    renderWithProviders(
      <ImageUploadField value="blob-abc" onChange={vi.fn()} containerName="images" />
    );
    expect(screen.getByTestId('blob-image')).toBeInTheDocument();
  });

  it('renders 1:1 frame as a circle', () => {
    renderWithProviders(
      <ImageUploadField value={null} onChange={vi.fn()} containerName="images" aspectRatio="1:1" />
    );
    const frame = document.querySelector('[data-aspect-ratio="1:1"]');
    expect(frame).toBeInTheDocument();
    expect(frame?.className).toContain('rounded-full');
  });

  it('renders 16:9 frame as a rectangle', () => {
    renderWithProviders(
      <ImageUploadField value={null} onChange={vi.fn()} containerName="images" aspectRatio="16:9" />
    );
    const frame = document.querySelector('[data-aspect-ratio="16:9"]');
    expect(frame).toBeInTheDocument();
    expect(frame?.className).toContain('rounded-md');
    expect(frame?.className).not.toContain('rounded-full');
  });

  it('shows uploading progress text', () => {
    vi.mocked(useBlobUpload).mockReturnValue({
      upload: mockUpload,
      state: { ...IDLE_STATE, phase: 'uploading', progress: 42 },
      reset: mockReset,
    });

    renderWithProviders(
      <ImageUploadField value={null} onChange={vi.fn()} containerName="images" />
    );

    expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    expect(screen.getByText(/42%/)).toBeInTheDocument();
  });

  it('shows validation error when file exceeds maxSizeBytes', async () => {
    const { user } = renderWithProviders(
      <ImageUploadField
        value={null}
        onChange={vi.fn()}
        containerName="images"
        maxSizeBytes={2 * 1024 * 1024} // 2 MB
      />
    );

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const bigFile = new File(['x'.repeat(3 * 1024 * 1024)], 'photo.jpg', {
      type: 'image/jpeg',
    });
    await user.upload(input, bigFile);

    expect(await screen.findByRole('alert')).toHaveTextContent('File exceeds 2 MB');
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('shows max size hint when maxSizeBytes is set and field is idle', () => {
    renderWithProviders(
      <ImageUploadField
        value={null}
        onChange={vi.fn()}
        containerName="images"
        maxSizeBytes={5 * 1024 * 1024}
      />
    );
    expect(screen.getByText('Max 5 MB')).toBeInTheDocument();
  });

  it('calls onChange with blobId after a successful upload', async () => {
    const blobId = 'blob-img-789';
    mockUpload.mockResolvedValue({ blobId, isValid: true });

    const handleChange = vi.fn();
    const { user } = renderWithProviders(
      <ImageUploadField value={null} onChange={handleChange} containerName="images" />
    );

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(['img'], 'avatar.png', { type: 'image/png' });
    await user.upload(input, file);

    await vi.waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith(blobId);
    });
  });

  it('calls onChange(null) and resets when clear button is clicked', async () => {
    const handleChange = vi.fn();
    const { user } = renderWithProviders(
      <ImageUploadField value="blob-123" onChange={handleChange} containerName="images" />
    );

    await user.click(screen.getByRole('button', { name: /remove image/i }));

    expect(handleChange).toHaveBeenCalledWith(null);
    expect(mockReset).toHaveBeenCalled();
  });

  it('disables both buttons when disabled prop is set', () => {
    renderWithProviders(
      <ImageUploadField value="blob-123" onChange={vi.fn()} containerName="images" disabled />
    );

    expect(screen.getByRole('button', { name: /replace/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /remove image/i })).toBeDisabled();
  });

  it('defaults accept to image/*', () => {
    renderWithProviders(
      <ImageUploadField value={null} onChange={vi.fn()} containerName="images" />
    );
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.accept).toBe('image/*');
  });

  it('passes a custom accept attribute', () => {
    renderWithProviders(
      <ImageUploadField value={null} onChange={vi.fn()} containerName="images" accept=".svg" />
    );
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.accept).toBe('.svg');
  });

  it('has data-slot attribute', () => {
    renderWithProviders(
      <ImageUploadField value={null} onChange={vi.fn()} containerName="images" />
    );
    expect(document.querySelector('[data-slot="image-upload-field"]')).toBeInTheDocument();
  });
});
