import { useRef, useState } from 'react';

import { useFinalizeUpload, useRequestUploadTicket } from '../hooks/use-document-mutations.js';

import type { DocumentResponse, UploadTicketResponse } from '@granit/documents';
import type { ChangeEvent, ReactNode } from 'react';

export interface UploadButtonLabels {
  readonly button?: string;
  readonly uploading?: string;
  readonly quotaExceeded?: string;
  readonly tooLarge?: string;
  readonly failed?: string;
}

export interface UploadButtonProps {
  /** Target folder. `null` drops the document directly under the tenant root. */
  readonly folderId: string | null;
  readonly onComplete?: (document: DocumentResponse) => void;
  /** Soft cap forwarded to the upload ticket request. Defaults to 1 GiB. */
  readonly maxAllowedBytes?: number;
  readonly labels?: UploadButtonLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<UploadButtonLabels> = {
  button: 'Upload',
  uploading: 'Uploading…',
  quotaExceeded: 'Tenant storage quota exceeded.',
  tooLarge: 'File is too large.',
  failed: 'Upload failed.',
};

const DEFAULT_MAX_ALLOWED_BYTES = 1024 * 1024 * 1024;

/**
 * Two-phase upload button:
 * 1. {@link useRequestUploadTicket} → presigned PUT URL + required headers.
 * 2. Direct PUT to blob storage via `XMLHttpRequest` to observe upload
 *    progress (the Fetch API has no upload-progress event).
 * 3. {@link useFinalizeUpload} to create the Document row.
 *
 * On HTTP 413 from the finalize step the {@link UploadButtonLabels.quotaExceeded}
 * label is surfaced. Errors set local state and clear the file input.
 */
export function UploadButton({
  folderId,
  onComplete,
  maxAllowedBytes = DEFAULT_MAX_ALLOWED_BYTES,
  labels,
  className,
}: UploadButtonProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestTicket = useRequestUploadTicket();
  const finalize = useFinalizeUpload();

  function uploadToBlobStore(ticket: UploadTicketResponse, file: File): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(ticket.httpMethod, ticket.uploadUrl);
      for (const [key, value] of Object.entries(ticket.requiredHeaders)) {
        xhr.setRequestHeader(key, value);
      }
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
          return;
        }
        reject(new Error(`Upload failed with HTTP ${xhr.status.toString()}`));
      };
      xhr.onerror = () => reject(new Error(labelStrings.failed));
      xhr.send(file);
    });
  }

  async function handleChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > maxAllowedBytes) {
      setError(labelStrings.tooLarge);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    try {
      setProgress(0);
      const ticket = await requestTicket.mutateAsync({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        maxAllowedBytes,
      });
      await uploadToBlobStore(ticket, file);
      const document = await finalize.mutateAsync({
        blobId: ticket.blobId,
        folderId,
        name: file.name,
      });
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
      onComplete?.(document);
    } catch (err) {
      const status = (err as { response?: { status?: number } } | undefined)?.response?.status;
      if (status === 413) {
        setError(labelStrings.quotaExceeded);
      } else if (err instanceof Error) {
        setError(err.message || labelStrings.failed);
      } else {
        setError(labelStrings.failed);
      }
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const isBusy = progress !== null;

  return (
    <div data-granit-upload-button="" className={className}>
      <label data-granit-upload-button-label="">
        <input
          ref={inputRef}
          type="file"
          data-granit-upload-button-input=""
          disabled={isBusy}
          onChange={handleChange}
        />
        <span>{isBusy ? labelStrings.uploading : labelStrings.button}</span>
      </label>
      {progress !== null && (
        <div
          data-granit-upload-button-progress=""
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          {progress}%
        </div>
      )}
      {error && (
        <div data-granit-upload-button-error="" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
