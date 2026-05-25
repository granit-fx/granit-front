import { useCallback, useRef, useState } from 'react';

import { useFileUpload } from '../hooks/use-file-upload.js';

import type { FileUploadError } from '../hooks/use-file-upload.js';
import type { DocumentResponse } from '@granit/documents';
import type { DragEvent, ReactNode } from 'react';

export interface UploadDropZoneLabels {
  readonly overlay?: string;
  readonly uploadingCount?: (done: number, total: number) => string;
  readonly tooLarge?: string;
  readonly quotaExceeded?: string;
  readonly failed?: string;
}

export interface UploadDropZoneProps {
  /** Target folder. `null` drops the document directly under the tenant root. */
  readonly folderId: string | null;
  /** Disable the drop target entirely (e.g. when the user lacks Manage). */
  readonly disabled?: boolean;
  /** Soft cap forwarded to the upload ticket request. Defaults to 1 GiB. */
  readonly maxAllowedBytes?: number;
  /** Fired once per successfully finalized document. */
  readonly onComplete?: (document: DocumentResponse) => void;
  /** Fired once after the whole batch has settled. */
  readonly onBatchDone?: (results: { readonly succeeded: number; readonly failed: number }) => void;
  readonly labels?: UploadDropZoneLabels;
  readonly className?: string;
  readonly children?: ReactNode;
}

const DEFAULT_LABELS: Required<UploadDropZoneLabels> = {
  overlay: 'Drop files to upload',
  uploadingCount: (done, total) => `Uploading ${String(done)} / ${String(total)}…`,
  tooLarge: 'File is too large.',
  quotaExceeded: 'Tenant storage quota exceeded.',
  failed: 'Upload failed.',
};

function pickErrorLabel(err: FileUploadError, labels: Required<UploadDropZoneLabels>): string {
  if (err.code === 'too-large') return labels.tooLarge;
  if (err.code === 'quota-exceeded') return labels.quotaExceeded;
  if (err.code === 'network') return labels.failed;
  return err.message || labels.failed;
}

/**
 * Renders a drop-target wrapper. When the user drags files over the area
 * (DataTransfer carries the `Files` type), an overlay appears; releasing
 * sequentially uploads each file via {@link useFileUpload} into
 * {@link UploadDropZoneProps.folderId | folderId}.
 *
 * Drops carrying other DataTransfer types (e.g. internal document drags
 * for move-to-folder) are ignored — those bubble through to other
 * handlers (FolderTree drop targets handle moves).
 *
 * Drag enter/leave use a counter trick: nested children fire enter/leave
 * events when the cursor crosses internal boundaries, so we track the
 * net depth instead of the boolean to keep the overlay stable.
 */
export function UploadDropZone({
  folderId,
  disabled = false,
  maxAllowedBytes,
  onComplete,
  onBatchDone,
  labels,
  className,
  children,
}: UploadDropZoneProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const { uploadFile, progress, lastError } = useFileUpload({ maxAllowedBytes });
  const [batch, setBatch] = useState<{ readonly done: number; readonly total: number } | null>(
    null
  );
  const [over, setOver] = useState(false);
  const depthRef = useRef(0);

  const carriesFiles = useCallback((event: DragEvent<HTMLDivElement>): boolean => {
    const types = event.dataTransfer.types;
    for (const type of types) {
      if (type === 'Files') return true;
    }
    return false;
  }, []);

  function handleDragEnter(event: DragEvent<HTMLDivElement>): void {
    if (disabled || !carriesFiles(event)) return;
    depthRef.current += 1;
    if (depthRef.current === 1) setOver(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>): void {
    if (disabled || !carriesFiles(event)) return;
    depthRef.current = Math.max(0, depthRef.current - 1);
    if (depthRef.current === 0) setOver(false);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>): void {
    if (disabled || !carriesFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>): Promise<void> {
    if (disabled || !carriesFiles(event)) return;
    event.preventDefault();
    depthRef.current = 0;
    setOver(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;
    let succeeded = 0;
    let failed = 0;
    setBatch({ done: 0, total: files.length });
    for (const file of files) {
      try {
        const doc = await uploadFile(file, folderId);
        succeeded += 1;
        onComplete?.(doc);
      } catch {
        failed += 1;
      }
      setBatch((prev) => (prev ? { done: prev.done + 1, total: prev.total } : null));
    }
    setBatch(null);
    onBatchDone?.({ succeeded, failed });
  }

  const errorMessage = lastError ? pickErrorLabel(lastError, labelStrings) : null;
  const showOverlay = over && !disabled;
  const isBusy = batch !== null;

  return (
    <div
      data-granit-upload-drop-zone=""
      data-granit-upload-drop-zone-over={showOverlay ? '' : undefined}
      data-granit-upload-drop-zone-busy={isBusy ? '' : undefined}
      data-granit-upload-drop-zone-disabled={disabled ? '' : undefined}
      className={className}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={(event) => {
        void handleDrop(event);
      }}
    >
      {children}
      {showOverlay && (
        <div data-granit-upload-drop-zone-overlay="" aria-hidden>
          <span>{labelStrings.overlay}</span>
        </div>
      )}
      {batch && (
        <div data-granit-upload-drop-zone-progress="" role="status" aria-live="polite">
          {labelStrings.uploadingCount(batch.done, batch.total)}
          {progress && ` — ${String(progress.percent)}%`}
        </div>
      )}
      {errorMessage && (
        <div data-granit-upload-drop-zone-error="" role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
