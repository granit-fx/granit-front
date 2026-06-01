import { useCallback, useState } from 'react';

import { useFinalizeUpload, useRequestUploadTicket } from './use-document-mutations';

import type { DocumentResponse, UploadTicketResponse } from '@granit/documents';

export interface UseFileUploadOptions {
  /** Soft cap forwarded to the upload ticket request. Defaults to 1 GiB. */
  readonly maxAllowedBytes?: number;
}

export interface FileUploadProgress {
  readonly file: File;
  readonly percent: number;
}

export interface FileUploadError {
  readonly file: File;
  readonly code: 'too-large' | 'quota-exceeded' | 'http' | 'network' | 'unknown';
  readonly message: string;
}

export interface UseFileUploadResult {
  readonly uploadFile: (file: File, folderId: string | null) => Promise<DocumentResponse>;
  readonly progress: FileUploadProgress | null;
  readonly lastError: FileUploadError | null;
  readonly resetError: () => void;
}

const DEFAULT_MAX_ALLOWED_BYTES = 1024 * 1024 * 1024;

class FileUploadFailure extends Error {
  readonly code: FileUploadError['code'];
  readonly file: File;
  constructor(file: File, code: FileUploadError['code'], message: string) {
    super(message);
    this.file = file;
    this.code = code;
  }
}

function putToBlobStore(
  ticket: UploadTicketResponse,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(ticket.httpMethod, ticket.uploadUrl);
    for (const [key, value] of Object.entries(ticket.requiredHeaders)) {
      xhr.setRequestHeader(key, value);
    }
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new FileUploadFailure(file, 'http', `Upload failed with HTTP ${String(xhr.status)}`));
    };
    xhr.onerror = () => reject(new FileUploadFailure(file, 'network', 'Network error'));
    xhr.send(file);
  });
}

/**
 * Two-phase upload primitive shared between {@link UploadButton} and
 * {@link UploadDropZone}:
 *
 * 1. `POST /documents/upload-ticket` → presigned PUT URL + headers.
 * 2. Direct PUT to blob storage via `XMLHttpRequest` (the Fetch API has
 *    no upload-progress event).
 * 3. `POST /documents/finalize` to create the Document row.
 *
 * Errors are normalized into {@link FileUploadError} with a discriminated
 * `code`, so callers can map them to labels without re-parsing axios shapes.
 * The hook is single-flight per call (`uploadFile` returns a promise per
 * file) — callers that want parallel uploads should call it concurrently;
 * callers that want serial uploads should `await` between calls.
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadResult {
  const maxAllowedBytes = options.maxAllowedBytes ?? DEFAULT_MAX_ALLOWED_BYTES;
  const requestTicket = useRequestUploadTicket();
  const finalize = useFinalizeUpload();
  const [progress, setProgress] = useState<FileUploadProgress | null>(null);
  const [lastError, setLastError] = useState<FileUploadError | null>(null);

  const resetError = useCallback(() => setLastError(null), []);

  const uploadFile = useCallback(
    async (file: File, folderId: string | null): Promise<DocumentResponse> => {
      setLastError(null);
      if (file.size > maxAllowedBytes) {
        const err: FileUploadError = { file, code: 'too-large', message: 'File is too large.' };
        setLastError(err);
        throw new FileUploadFailure(file, err.code, err.message);
      }
      setProgress({ file, percent: 0 });
      try {
        const ticket = await requestTicket.mutateAsync({
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          maxAllowedBytes,
        });
        await putToBlobStore(ticket, file, (percent) => setProgress({ file, percent }));
        const document = await finalize.mutateAsync({
          blobId: ticket.blobId,
          folderId,
          name: file.name,
        });
        setProgress(null);
        return document;
      } catch (err) {
        const status = (err as { response?: { status?: number } } | undefined)?.response?.status;
        const code: FileUploadError['code'] =
          status === 413
            ? 'quota-exceeded'
            : err instanceof FileUploadFailure
              ? err.code
              : 'unknown';
        // Keep the raw message verbatim (empty when none) — callers decide
        // whether to surface it directly or fall back to a localized label.
        const message = err instanceof Error ? err.message : '';
        const normalized: FileUploadError = { file, code, message };
        setLastError(normalized);
        setProgress(null);
        throw err instanceof Error ? err : new Error(message || 'Upload failed.');
      }
    },
    [finalize, maxAllowedBytes, requestTicket]
  );

  return { uploadFile, progress, lastError, resetError };
}
