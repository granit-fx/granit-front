import { BlobImage, useBlobUpload } from '@granit/react-blob-storage';
import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { ImageOff, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';

/** Aspect ratio of the image preview frame. `'1:1'` renders as a circle (avatar convention). */
export type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '3:2' | '2:3';

export interface ImageUploadFieldProps {
  /** Current blob id (or `null` for empty). Stored verbatim as the field value. */
  readonly value: string | null;
  /** Called with the new blob id after a successful upload, or `null` on clear. */
  readonly onChange: (next: string | null) => void;
  /** Storage container the upload routes to (e.g. `'images'`, `'avatars'`). */
  readonly containerName: string;
  /**
   * `accept` attribute on the underlying `<input type="file">`. Defaults to
   * `'image/*'`. Override when a specific format is required (e.g. `'.svg'`).
   */
  readonly accept?: string;
  /**
   * Preview frame aspect ratio. `'1:1'` renders as a circle (avatar convention);
   * all other ratios render as a rounded rectangle. Drives the preview's CSS
   * `aspect-ratio` so the user sees the cadrage hint before picking a file.
   */
  readonly aspectRatio?: AspectRatio;
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

interface FrameMetrics {
  readonly css: string;
  readonly isCircle: boolean;
  readonly width: string;
}

function frameFor(ratio: AspectRatio): FrameMetrics {
  switch (ratio) {
    case '1:1':
      return { css: '1 / 1', isCircle: true, width: 'w-20' };
    case '4:3':
      return { css: '4 / 3', isCircle: false, width: 'w-32' };
    case '3:4':
      return { css: '3 / 4', isCircle: false, width: 'w-20' };
    case '16:9':
      return { css: '16 / 9', isCircle: false, width: 'w-40' };
    case '9:16':
      return { css: '9 / 16', isCircle: false, width: 'w-20' };
    case '3:2':
      return { css: '3 / 2', isCircle: false, width: 'w-32' };
    case '2:3':
      return { css: '2 / 3', isCircle: false, width: 'w-20' };
  }
}

const DEFAULT_ACCEPT = 'image/*';
const DEFAULT_ASPECT_RATIO: AspectRatio = '1:1';

export function ImageUploadField({
  value,
  onChange,
  containerName,
  accept = DEFAULT_ACCEPT,
  aspectRatio = DEFAULT_ASPECT_RATIO,
  maxSizeBytes,
  disabled,
  id,
  name,
  className,
}: ImageUploadFieldProps): ReactNode {
  const { t } = useTranslation();
  const { upload, state, reset } = useBlobUpload();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const frame = useMemo(() => frameFor(aspectRatio), [aspectRatio]);
  const busy =
    state.phase === 'initiating' || state.phase === 'uploading' || state.phase === 'confirming';

  const previewLabel = value
    ? t('BlobStorage.Upload.ImagePreview', 'Image preview')
    : t('BlobStorage.Upload.NoImage', 'No image selected');

  const handlePick = useCallback(() => {
    if (disabled || busy) return;
    setValidationError(null);
    inputRef.current?.click();
  }, [disabled, busy]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
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

      try {
        const result = await upload({ file, containerName });
        onChange(result.blobId);
      } catch {
        // useBlobUpload surfaces the error through state.error.
      }
    },
    [upload, containerName, onChange, maxSizeBytes, t]
  );

  const handleClear = useCallback(() => {
    if (disabled || busy) return;
    reset();
    setValidationError(null);
    onChange(null);
  }, [disabled, busy, reset, onChange]);

  const error = validationError ?? (state.phase === 'error' ? state.error?.message : null);
  const maxSizeMb = maxSizeBytes === undefined ? null : (maxSizeBytes / (1024 * 1024)).toFixed(0);

  return (
    <div data-slot="image-upload-field" className={cn('flex items-center gap-3', className)}>
      {/* Preview frame */}
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden border border-border bg-muted',
          frame.width,
          frame.isCircle ? 'rounded-full' : 'rounded-md',
          disabled && 'opacity-60'
        )}
        style={{ aspectRatio: frame.css }}
        aria-label={previewLabel}
        data-aspect-ratio={aspectRatio}
      >
        {value ? (
          <BlobImage
            blobId={value}
            alt=""
            loading="lazy"
            className="size-full object-cover"
            fallback={<ImageOff className="size-6 text-muted-foreground" aria-hidden="true" />}
          />
        ) : (
          <ImageOff className="size-6 text-muted-foreground" aria-hidden="true" />
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="size-5 animate-spin text-foreground" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePick}
            disabled={disabled || busy}
            data-slot="image-upload-pick"
          >
            <ImagePlus className="mr-2 size-4" aria-hidden="true" />
            {value
              ? t('BlobStorage.Upload.ReplaceImage', 'Replace')
              : t('BlobStorage.Upload.UploadImage', 'Upload')}
          </Button>
          {value && !busy && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              aria-label={t('BlobStorage.Upload.RemoveImage', 'Remove image')}
              data-slot="image-upload-clear"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        {state.phase === 'uploading' && (
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {t('BlobStorage.Upload.Uploading', 'Uploading…')} {state.progress}%
          </span>
        )}

        {error && (
          <span className="text-xs text-destructive" role="alert">
            {error}
          </span>
        )}

        {maxSizeMb !== null && !busy && state.phase !== 'error' && !error && (
          <span className="text-xs text-muted-foreground">
            {t('BlobStorage.Upload.MaxSize', 'Max {{size}} MB', { size: maxSizeMb })}
          </span>
        )}
      </div>

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
