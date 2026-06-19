import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CHAT_ATTACHMENT_MAX_BYTES } from '../constants';
import { useAIChatBlobUpload } from '../hooks/use-ai-chat-blob-upload';

import type { BlobConfirmUploadResponse } from '@granit/blob-storage';

const mockUpload =
  vi.fn<
    (params: {
      file: File;
      containerName: string;
      onProgress?: (pct: number) => void;
    }) => Promise<BlobConfirmUploadResponse>
  >();

vi.mock('@granit/react-blob-storage', () => ({
  useBlobUpload: () => ({ upload: mockUpload, state: {}, reset: vi.fn() }),
}));

const validConfirmation: BlobConfirmUploadResponse = {
  blobId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  isValid: true,
  status: 'Valid',
  verifiedContentType: 'application/pdf',
  sizeBytes: 2048,
  rejectionReason: null,
};

function makeFile(name: string, type: string, size: number): File {
  const content = new Uint8Array(size);
  return new File([content], name, { type });
}

beforeEach(() => {
  mockUpload.mockReset();
});

describe('useAIChatBlobUpload', () => {
  it('uploads and maps to AttachmentRequest shape', async () => {
    mockUpload.mockResolvedValueOnce(validConfirmation);
    const { result } = renderHook(() => useAIChatBlobUpload('chat-attachments'));

    const file = makeFile('report.pdf', 'application/pdf', 1024);
    const attachment = await result.current(file);

    expect(mockUpload).toHaveBeenCalledWith({ file, containerName: 'chat-attachments' });
    expect(attachment).toEqual({
      reference: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      fileName: 'report.pdf',
      contentType: 'application/pdf',
      sizeBytes: 2048,
    });
  });

  it('falls back to file metadata when server returns nulls', async () => {
    mockUpload.mockResolvedValueOnce({
      ...validConfirmation,
      verifiedContentType: null,
      sizeBytes: null,
    });
    const { result } = renderHook(() => useAIChatBlobUpload('chat-attachments'));

    const file = makeFile('notes.txt', 'text/plain', 512);
    const attachment = await result.current(file);

    expect(attachment.contentType).toBe('text/plain');
    expect(attachment.sizeBytes).toBe(512);
  });

  it('rejects when file exceeds maxBytes', async () => {
    const { result } = renderHook(() => useAIChatBlobUpload('chat-attachments'));

    const file = makeFile('huge.pdf', 'application/pdf', CHAT_ATTACHMENT_MAX_BYTES + 1);
    await expect(result.current(file)).rejects.toThrow('File too large');
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('respects a custom maxBytes override', async () => {
    const { result } = renderHook(() =>
      useAIChatBlobUpload('chat-attachments', { maxBytes: 1024 })
    );

    const file = makeFile('small.txt', 'text/plain', 1025);
    await expect(result.current(file)).rejects.toThrow('File too large');
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('rejects when the backend marks the blob invalid', async () => {
    mockUpload.mockResolvedValueOnce({
      blobId: 'bad-blob',
      isValid: false,
      status: 'Rejected',
      verifiedContentType: null,
      sizeBytes: null,
      rejectionReason: 'Content type not allowed',
    });
    const { result } = renderHook(() => useAIChatBlobUpload('chat-attachments'));

    const file = makeFile('virus.exe', 'application/octet-stream', 100);
    await expect(result.current(file)).rejects.toThrow('Content type not allowed');
  });

  it('rejects with generic message when rejectionReason is null', async () => {
    mockUpload.mockResolvedValueOnce({
      blobId: 'bad-blob',
      isValid: false,
      status: 'Rejected',
      verifiedContentType: null,
      sizeBytes: null,
      rejectionReason: null,
    });
    const { result } = renderHook(() => useAIChatBlobUpload('chat-attachments'));

    const file = makeFile('bad.bin', 'application/octet-stream', 100);
    await expect(result.current(file)).rejects.toThrow('Blob validation failed');
  });

  it('propagates upload errors from useBlobUpload', async () => {
    mockUpload.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useAIChatBlobUpload('chat-attachments'));

    const file = makeFile('doc.pdf', 'application/pdf', 256);
    await expect(result.current(file)).rejects.toThrow('Network error');
  });
});
