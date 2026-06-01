import { confirmUpload, initiateUpload } from '@granit/blob-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { useBlobStorageConfig } from '../providers/blob-storage-provider';

import { blobStorageKeys } from './query-keys';

import type { BlobConfirmUploadResponse } from '@granit/blob-storage';

/** Upload progress phase. */
export type BlobUploadPhase =
  | 'idle'
  | 'initiating'
  | 'uploading'
  | 'confirming'
  | 'complete'
  | 'error';

/** Current state of the upload orchestration. */
export interface BlobUploadState {
  readonly phase: BlobUploadPhase;
  /** Upload progress 0–100, only meaningful during `uploading` phase. */
  readonly progress: number;
  /** Blob ID assigned by the server after initiation. */
  readonly blobId: string | null;
  /** Confirmation result, available when phase is `complete`. */
  readonly result: BlobConfirmUploadResponse | null;
  /** Error, available when phase is `error`. */
  readonly error: Error | null;
}

/** Parameters for starting an upload. */
export interface BlobUploadParams {
  readonly file: File;
  readonly containerName: string;
  readonly onProgress?: (percent: number) => void;
}

/** Return type of {@link useBlobUpload}. */
export interface UseBlobUploadReturn {
  /** Start the three-step upload flow (initiate → PUT → confirm). */
  readonly upload: (params: BlobUploadParams) => Promise<BlobConfirmUploadResponse>;
  /** Current upload state. */
  readonly state: BlobUploadState;
  /** Reset state back to idle. */
  readonly reset: () => void;
}

interface XhrUploadParams {
  readonly url: string;
  readonly method: string;
  readonly headers: Record<string, string>;
  readonly body: File;
  readonly onProgress?: (percent: number) => void;
}

function uploadViaXhr(
  params: XhrUploadParams,
  abortRef: React.RefObject<XMLHttpRequest | null>
): Promise<void> {
  const { url, method, headers, body, onProgress } = params;

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    abortRef.current = xhr;

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      abortRef.current = null;
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      abortRef.current = null;
      reject(new Error('Upload failed: network error'));
    });

    xhr.addEventListener('abort', () => {
      abortRef.current = null;
      reject(new Error('Upload aborted'));
    });

    xhr.open(method, url);
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }
    xhr.send(body);
  });
}

const IDLE_STATE: BlobUploadState = {
  phase: 'idle',
  progress: 0,
  blobId: null,
  result: null,
  error: null,
};

/**
 * Orchestration hook for the full direct-to-cloud upload flow.
 *
 * 1. **Initiate**: `POST /upload` to get a pre-signed URL
 * 2. **Upload**: `PUT` the file directly to the storage provider using the pre-signed URL
 * 3. **Confirm**: `POST /{id}/confirm` to run the server validation pipeline
 *
 * The S3/Azure PUT uses `XMLHttpRequest` (not axios) because the pre-signed URL
 * points to the storage provider, not the application API.
 *
 * @example
 * ```tsx
 * const { upload, state, reset } = useBlobUpload();
 *
 * const handleFile = async (file: File) => {
 *   const result = await upload({ file, containerName: 'documents' });
 *   if (result.isValid) console.log('Upload validated:', result.blobId);
 * };
 * ```
 */
export function useBlobUpload(): UseBlobUploadReturn {
  const { client, basePath } = useBlobStorageConfig();
  const queryClient = useQueryClient();
  const [state, setState] = useState<BlobUploadState>(IDLE_STATE);
  const abortRef = useRef<XMLHttpRequest | null>(null);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setState(IDLE_STATE);
  }, []);

  const upload = useCallback(
    async (params: BlobUploadParams): Promise<BlobConfirmUploadResponse> => {
      const { file, containerName, onProgress } = params;

      try {
        // Step 1: Initiate upload
        setState({
          phase: 'initiating',
          progress: 0,
          blobId: null,
          result: null,
          error: null,
        });

        const ticket = await initiateUpload(client, `${basePath}/blobs`, {
          containerName,
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
        });

        setState((prev) => ({ ...prev, phase: 'uploading', blobId: ticket.blobId }));

        // Step 2: Upload file to pre-signed URL via XMLHttpRequest (for progress)
        await uploadViaXhr(
          {
            url: ticket.uploadUrl,
            method: ticket.httpMethod,
            headers: ticket.requiredHeaders,
            body: file,
            onProgress: (percent) => {
              setState((prev) => ({ ...prev, progress: percent }));
              onProgress?.(percent);
            },
          },
          abortRef
        );

        // Step 3: Confirm upload
        setState((prev) => ({ ...prev, phase: 'confirming', progress: 100 }));

        const confirmation = await confirmUpload(client, `${basePath}/blobs`, ticket.blobId, {
          containerName,
        });

        setState({
          phase: 'complete',
          progress: 100,
          blobId: ticket.blobId,
          result: confirmation,
          error: null,
        });

        await queryClient.invalidateQueries({ queryKey: blobStorageKeys.blobs() });

        return confirmation;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState((prev) => ({ ...prev, phase: 'error', error }));
        throw error;
      }
    },
    [client, basePath, queryClient]
  );

  return { upload, state, reset };
}
