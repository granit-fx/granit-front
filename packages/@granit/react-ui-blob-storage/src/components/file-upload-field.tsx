import { useBlobUpload } from '@granit/react-blob-storage';
import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { File as FileIcon, Loader2, Paperclip, X } from 'lucide-react';
import { useCallback, useRef, useState, type ChangeEvent, type ReactNode } from 'react';

import { logger } from '../logger';

export interface FileUploadFieldProps {
  /** Current blob id (or `null` for empty). Stored verbatim as the field value. */
  readonly value: string | null;
  /** Called with the new blob id after a successful upload, or `null` on clear. */
  readonly onChange: (next: string | null) => void;
  /** Storage container the upload routes to (e.g. `'documents'`, `'attachments'`). */
  readonly containerName: string;
  /**
   * `accept` attribute on the underlying `<input type="file">`. Follows the
   * HTML spec: MIME types, wildcards, and extensions are all valid.
   * No default — any file type is accepted when omitted.
   *
   * @example `'.pdf,.docx'`
   * @example `'image/*,application/pdf'`
   */
  readonly accept?: string;
  /**
   * Hard cap on the picked file size (bytes), validated client-side before
   * the upload starts. The backend should still enforce its own cap — this
   * is a fast UX reject for obvious oversized files.
   */
  readonly maxSizeBytes?: number;
  /** Disables both the picker and the clear button. */
  readonly disabled?: boolean;
  /** Forwarded to the `<input>`'s `id` attribute (for `<label htmlFor>` wiring). */
  readonly id?: string;
  /** Forwarded to the `<input>`'s `name` attribute. */
  readonly name?: string;
  readonly className?: string;
}

export function FileUploadField({
  value,
  onChange,
  containerName,
  accept,
  maxSizeBytes,
  disabled,
  id,
  name,
  className,
}: FileUploadFieldProps): ReactNode {
  const { t } = useTranslation();
  const { upload, state, reset } = useBlobUpload();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const busy =
    state.phase === 'initiating' || state.phase === 'uploading' || state.phase === 'confirming';

  // Show the file row when an upload is in flight or a value is committed.
  const showFileRow = value !== null || busy;
  const displayName =
    fileName ?? (value !== null ? t('BlobStorage.Upload.FileSelected', 'File selected') : null);

  const handlePick = useCallback(() => {
    if (disabled || busy) return;
    setValidationError(null);
    inputRef.current?.click();
  }, [disabled, busy]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Reset value immediately so selecting the same file twice re-triggers onChange.
      event.target.value = '';
      if (!file) return;

      setValidationError(null);

      if (maxSizeBytes !== undefined && file.size > maxSizeBytes) {
        const mb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
        setValidationError(
          t('BlobStorage.Upload.TooLarge', 'File exceeds {{size}} MB', { size: mb })
        );
        return;
      }

      setFileName(file.name);

      try {
        const result = await upload({ file, containerName });
        onChange(result.blobId);
      } catch (err) {
        // useBlobUpload surfaces the error to the user through state.error;
        // this records the developer-facing detail without re-toasting.
        logger.debug('File upload failed', { fileName: file.name, err });
      }
    },
    [upload, containerName, onChange, maxSizeBytes, t]
  );

  const handleClear = useCallback(() => {
    if (disabled || busy) return;
    reset();
    setValidationError(null);
    setFileName(null);
    onChange(null);
  }, [disabled, busy, reset, onChange]);

  const error = validationError ?? (state.phase === 'error' ? state.error?.message : null);

  return (
    <div data-slot="file-upload-field" className={cn('flex flex-col gap-1.5', className)}>
      {showFileRow ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2">
          <FileIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-sm">{displayName}</span>
          {busy ? (
            <Loader2
              className="size-4 shrink-0 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          ) : (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              aria-label={t('BlobStorage.Upload.RemoveFile', 'Remove file')}
              className="shrink-0 text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePick}
          disabled={disabled || busy}
          data-slot="file-upload-pick"
        >
          <Paperclip className="mr-2 size-4" aria-hidden="true" />
          {t('BlobStorage.Upload.ChooseFile', 'Choose file')}
        </Button>
      )}

      {state.phase === 'uploading' && (
        <div className="flex items-center gap-2">
          <progress
            value={state.progress}
            max={100}
            className="h-1.5 flex-1 overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary"
            aria-label={t('BlobStorage.Upload.UploadProgress', 'Upload progress')}
          />
          <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
            {state.progress}%
          </span>
        </div>
      )}

      {error && (
        <span className="text-xs text-destructive" role="alert">
          {error}
        </span>
      )}

      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        disabled={disabled || busy}
        onChange={handleFileChange}
        className="sr-only"
      />
    </div>
  );
}
