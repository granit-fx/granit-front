import { useRef } from 'react';

import { useFileUpload } from '../hooks/use-file-upload.js';

import type { FileUploadError } from '../hooks/use-file-upload.js';
import type { DocumentResponse } from '@granit/documents';
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

function pickErrorLabel(err: FileUploadError, labels: Required<UploadButtonLabels>): string {
  if (err.code === 'too-large') return labels.tooLarge;
  if (err.code === 'quota-exceeded') return labels.quotaExceeded;
  // Surface the raw message when present (matches the pre-refactor contract
  // — HTTP statuses, axios validation messages, etc. are usually useful).
  // Network failures from XHR have a fixed "Network error" placeholder; the
  // label is preferable there.
  if (err.code === 'network') return labels.failed;
  return err.message || labels.failed;
}

/**
 * Single-file upload button. Thin shell over {@link useFileUpload}: the
 * native `<input type="file">` triggers `uploadFile` with the picked file,
 * and the hook surfaces progress + a normalized error code. The component
 * only owns DOM concerns (the hidden input, the visible label, the
 * progress + error markers).
 */
export function UploadButton({
  folderId,
  onComplete,
  maxAllowedBytes,
  labels,
  className,
}: UploadButtonProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { uploadFile, progress, lastError } = useFileUpload({ maxAllowedBytes });

  async function handleChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const document = await uploadFile(file, folderId);
      onComplete?.(document);
    } catch {
      /* normalized into lastError by the hook */
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const isBusy = progress !== null;
  const errorMessage = lastError ? pickErrorLabel(lastError, labelStrings) : null;

  return (
    <div data-granit-upload-button="" className={className}>
      <label data-granit-upload-button-label="">
        <input
          ref={inputRef}
          type="file"
          data-granit-upload-button-input=""
          disabled={isBusy}
          onChange={(event) => {
            void handleChange(event);
          }}
        />
        <span>{isBusy ? labelStrings.uploading : labelStrings.button}</span>
      </label>
      {progress !== null && (
        <div
          data-granit-upload-button-progress=""
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percent}
        >
          {progress.percent}%
        </div>
      )}
      {errorMessage && (
        <div data-granit-upload-button-error="" role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
