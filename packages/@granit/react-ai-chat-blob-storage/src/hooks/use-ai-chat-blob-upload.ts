import { useBlobUpload } from '@granit/react-blob-storage';
import { useCallback } from 'react';

import { CHAT_ATTACHMENT_MAX_BYTES } from '../constants';

import type { UploadAttachment } from '@granit/react-ai-chat';

export interface UseAIChatBlobUploadOptions {
  /** Override the maximum file size in bytes (default: {@link CHAT_ATTACHMENT_MAX_BYTES}). */
  readonly maxBytes?: number;
}

/**
 * Returns an {@link UploadAttachment} adapter backed by blob storage.
 * Inject into `ChatComposer` via the `uploadAttachment` prop.
 */
export function useAIChatBlobUpload(
  containerName: string,
  options?: UseAIChatBlobUploadOptions
): UploadAttachment {
  const { upload } = useBlobUpload();
  const maxBytes = options?.maxBytes ?? CHAT_ATTACHMENT_MAX_BYTES;

  return useCallback(
    async (file: File) => {
      if (file.size > maxBytes) {
        throw new Error(`File too large: ${file.size} bytes (max ${maxBytes} bytes)`);
      }

      const result = await upload({ file, containerName });

      if (!result.isValid) {
        throw new Error(result.rejectionReason ?? 'Blob validation failed');
      }

      return {
        reference: result.blobId,
        fileName: file.name,
        contentType: result.verifiedContentType ?? file.type,
        sizeBytes: result.sizeBytes ?? file.size,
      };
    },
    [upload, containerName, maxBytes]
  );
}
