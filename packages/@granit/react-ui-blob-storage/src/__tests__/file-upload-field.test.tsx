import { screen } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FileUploadField } from '../components/file-upload-field';

import { renderWithProviders } from './test-utils';

import type { BlobUploadState } from '@granit/react-blob-storage';
import type { UseBlobUploadReturn } from '@granit/react-blob-storage';

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
}));

// useBlobUpload is mocked above — import after to get the mocked version.
const { useBlobUpload } = await import('@granit/react-blob-storage');

beforeEach(() => {
  vi.mocked(useBlobUpload).mockReturnValue({
    upload: mockUpload,
    state: IDLE_STATE,
    reset: mockReset,
  });
  vi.clearAllMocks();
});

describe('FileUploadField', () => {
  it('renders the pick button when no value is set', () => {
    renderWithProviders(<FileUploadField value={null} onChange={vi.fn()} containerName="docs" />);
    expect(screen.getByText('Choose file')).toBeInTheDocument();
  });

  it('shows file row with filename after upload completes', () => {
    renderWithProviders(
      <FileUploadField value="blob-123" onChange={vi.fn()} containerName="docs" />
    );
    // Value is set externally — filename not tracked, falls back to generic label.
    expect(screen.getByText('File selected')).toBeInTheDocument();
    expect(screen.queryByText('Choose file')).not.toBeInTheDocument();
  });

  it('shows file row with spinner when upload is in flight', () => {
    vi.mocked(useBlobUpload).mockReturnValue({
      upload: mockUpload,
      state: { ...IDLE_STATE, phase: 'uploading', progress: 45 },
      reset: mockReset,
    });

    renderWithProviders(<FileUploadField value={null} onChange={vi.fn()} containerName="docs" />);

    // File row visible even when value is null (upload in flight).
    expect(screen.queryByText('Choose file')).not.toBeInTheDocument();
  });

  it('shows progress bar during upload', () => {
    vi.mocked(useBlobUpload).mockReturnValue({
      upload: mockUpload,
      state: { ...IDLE_STATE, phase: 'uploading', progress: 67 },
      reset: mockReset,
    });

    renderWithProviders(<FileUploadField value={null} onChange={vi.fn()} containerName="docs" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  it('shows validation error when file exceeds maxSizeBytes', async () => {
    const { user } = renderWithProviders(
      <FileUploadField
        value={null}
        onChange={vi.fn()}
        containerName="docs"
        maxSizeBytes={1024 * 1024} // 1 MB
      />
    );

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const bigFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });
    await user.upload(input, bigFile);

    expect(await screen.findByRole('alert')).toHaveTextContent('File exceeds 1 MB');
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('calls onChange with blobId after a successful upload', async () => {
    const blobId = 'blob-new-456';
    mockUpload.mockResolvedValue({ blobId, isValid: true });

    const handleChange = vi.fn();
    renderWithProviders(
      <FileUploadField value={null} onChange={handleChange} containerName="docs" />
    );

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });
    const { user } = renderWithProviders(
      <FileUploadField value={null} onChange={handleChange} containerName="docs" />
    );
    await user.upload(input, file);

    await vi.waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith(blobId);
    });
  });

  it('calls onChange(null) and resets state when clear button is clicked', async () => {
    const handleChange = vi.fn();
    const { user } = renderWithProviders(
      <FileUploadField value="blob-123" onChange={handleChange} containerName="docs" />
    );

    await user.click(screen.getByRole('button', { name: 'Remove file' }));

    expect(handleChange).toHaveBeenCalledWith(null);
    expect(mockReset).toHaveBeenCalled();
  });

  it('disables the clear button when disabled prop is set', () => {
    renderWithProviders(
      <FileUploadField value="blob-123" onChange={vi.fn()} containerName="docs" disabled />
    );

    expect(screen.getByRole('button', { name: 'Remove file' })).toBeDisabled();
  });

  it('disables the pick button when disabled prop is set', () => {
    renderWithProviders(
      <FileUploadField value={null} onChange={vi.fn()} containerName="docs" disabled />
    );

    expect(screen.getByRole('button', { name: /choose file/i })).toBeDisabled();
  });

  it('shows upload error from state', () => {
    vi.mocked(useBlobUpload).mockReturnValue({
      upload: mockUpload,
      state: {
        ...IDLE_STATE,
        phase: 'error',
        error: new Error('Upload failed: network error'),
      },
      reset: mockReset,
    });

    renderWithProviders(<FileUploadField value={null} onChange={vi.fn()} containerName="docs" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Upload failed: network error');
  });

  it('passes accept attribute to the hidden input', () => {
    renderWithProviders(
      <FileUploadField value={null} onChange={vi.fn()} containerName="docs" accept=".pdf,.docx" />
    );

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.accept).toBe('.pdf,.docx');
  });

  it('has data-slot attribute', () => {
    renderWithProviders(<FileUploadField value={null} onChange={vi.fn()} containerName="docs" />);
    expect(document.querySelector('[data-slot="file-upload-field"]')).toBeInTheDocument();
  });
});
