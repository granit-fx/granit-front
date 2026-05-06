import { useGranitClient } from '@granit/react-api-client';
import { useCallback, useRef, useState, type ChangeEvent, type ReactNode } from 'react';

import { useBlobUpload, type BlobUploadState } from '../hooks/use-blob-upload.js';

import { BlobImage } from './blob-image.js';

export interface BlobUploadFieldProps {
  /** Current blob id (or `null` for empty). Stored verbatim as the field value. */
  readonly value: string | null;
  /** Called with the new blob id after a successful upload, or `null` on clear. */
  readonly onChange: (next: string | null) => void;
  /**
   * Container the upload routes to (e.g. `'avatars'`, `'product-images'`).
   * Required — the framework has no opinion on container naming, the host
   * picks one per domain.
   */
  readonly containerName: string;
  /**
   * `accept` attribute on the underlying `<input type="file">`. Defaults
   * to `'image/*'` since the most common use case is image upload; pass
   * `''` (or any other MIME pattern) for non-image fields.
   */
  readonly accept?: string;
  /** Disables both the picker and the clear button. */
  readonly disabled?: boolean;
  /** Forwarded to the `<input>`'s `id` attribute (for `<label htmlFor>` wiring). */
  readonly id?: string;
  /** Forwarded to the `<input>`'s `name` attribute. */
  readonly name?: string;
  /**
   * Hard cap on the picked file size (bytes), validated client-side
   * before the upload PUT fires. Files exceeding the cap surface an
   * error message via `validateFile` (default: a localizable
   * "File exceeds X MB" string) and short-circuit the upload — the
   * backend should still enforce its own cap, this is a fast UX
   * reject for the obvious 50 MB photo. Omit for no client-side cap.
   */
  readonly maxSizeBytes?: number;
  /**
   * Custom file-level validator run before the upload starts. Return a
   * truthy error string to abort with that message, or `null` /
   * `undefined` to let the upload proceed. Runs before the `maxSizeBytes`
   * check so apps can short-circuit on MIME / extension / pixel-size
   * concerns. The error surfaces through the same
   * `data-granit-blob-upload-error` slot as upload failures.
   */
  readonly validateFile?: (file: File) => string | null | undefined;
  /**
   * Override the preview slot. Receives the current blob id (or `null`)
   * and the upload state so the host can paint a richer preview (e.g.
   * a circular avatar with a loading spinner). Pass `null` to suppress
   * the framework default entirely. When omitted, the field renders
   * `<BlobImage blobId={value} alt="" loading="lazy" />` — works for
   * the avatar case out of the box.
   */
  readonly renderPreview?: ((blobId: string | null, state: BlobUploadState) => ReactNode) | null;
  /**
   * Override the clear-button slot. Receives the `clear` callback (which
   * also resets the upload state). Returning `null` suppresses it.
   * When omitted, a minimal unstyled `<button type="button">Clear</button>`
   * appears once `value` is set and the upload isn't busy.
   */
  readonly renderClear?: ((args: { clear: () => void; disabled: boolean }) => ReactNode) | null;
  /** Optional class for the root element. Forwarded verbatim to the wrapping `<div>`. */
  readonly className?: string;
}

const DEFAULT_ACCEPT = 'image/*';

/**
 * Generic blob-upload field — orchestrates the three-step direct-to-cloud
 * upload (initiate → PUT → confirm) via {@link useBlobUpload} and stores
 * the resulting blob id as the field value. The form layer keeps
 * `BlobReference` opaque (a string id on the wire); resolving it back to
 * a URL for rendering is `<BlobImage>`'s job.
 *
 * Markup is intentionally unstyled — emits a structured DOM scaffold
 * with `data-granit-blob-upload-*` data attributes so apps style it
 * with the rest of their form chrome:
 *
 * ```html
 * <div data-granit-blob-upload data-phase="idle" data-busy>
 *   <div data-granit-blob-upload-preview>
 *     <img src="…" loading="lazy" />
 *   </div>
 *   <input type="file" accept="image/*" data-granit-blob-upload-input />
 *   <button type="button" data-granit-blob-upload-clear>Clear</button>
 *   <progress value="42" max="100" data-granit-blob-upload-progress />
 *   <span role="alert" data-granit-blob-upload-error>…</span>
 * </div>
 * ```
 *
 * Apps that need a polished UX (shadcn / Material / Tailwind chrome)
 * pass `renderPreview` / `renderClear` overrides to plug in their own
 * preview tile + remove button, and rely on the same `data-phase` /
 * `data-busy` attributes for visual states. The framework handles all
 * the upload mechanics — file picker, progress bar wiring, error
 * surface, optimistic state.
 *
 * @example
 * ```tsx
 * // Minimal usage — out-of-the-box <BlobImage> preview, default clear button.
 * <BlobUploadField
 *   value={blobId}
 *   onChange={setBlobId}
 *   containerName="avatars"
 * />
 *
 * // Form-component adapter for `<EntityRendererProvider>`.
 * const blobUploadFormComponent: EntityFormComponent = ({ field, value, onChange, readOnly }) => {
 *   const { containerName = 'blobs' } = (field.config ?? {}) as { containerName?: string };
 *   return (
 *     <BlobUploadField
 *       id={`field-${field.propertyName}`}
 *       name={field.propertyName}
 *       value={typeof value === 'string' ? value : null}
 *       onChange={onChange}
 *       containerName={containerName}
 *       disabled={readOnly}
 *     />
 *   );
 * };
 * ```
 */
export function BlobUploadField({
  value,
  onChange,
  containerName,
  accept = DEFAULT_ACCEPT,
  disabled,
  id,
  name,
  maxSizeBytes,
  validateFile,
  renderPreview,
  renderClear,
  className,
}: BlobUploadFieldProps): ReactNode {
  const client = useGranitClient();
  const { upload, state, reset } = useBlobUpload({ client });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const busy =
    state.phase === 'initiating' || state.phase === 'uploading' || state.phase === 'confirming';

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Reset the input's value immediately so picking the same file twice
      // re-triggers `onChange` (browsers swallow the second selection
      // otherwise).
      event.target.value = '';
      if (!file) return;

      // Clear any prior validation surface before running the new checks.
      setValidationError(null);

      // Custom validator runs first so apps can short-circuit on MIME /
      // extension / pixel-size concerns before the size cap fires.
      const customError = validateFile?.(file);
      if (customError) {
        setValidationError(customError);
        return;
      }
      if (maxSizeBytes !== undefined && file.size > maxSizeBytes) {
        const mb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
        setValidationError(`File exceeds ${mb} MB`);
        return;
      }

      try {
        const result = await upload({ file, containerName });
        onChange(result.blobId);
      } catch {
        // `useBlobUpload` exposes the error through `state.error`; the
        // catch here just prevents an unhandled rejection — the UI surfaces
        // the failure via the `data-granit-blob-upload-error` slot.
      }
    },
    [upload, containerName, onChange, maxSizeBytes, validateFile]
  );

  const handleClear = useCallback(() => {
    if (disabled || busy) return;
    reset();
    setValidationError(null);
    onChange(null);
  }, [disabled, busy, reset, onChange]);

  const preview =
    renderPreview === null ? null : renderPreview ? (
      renderPreview(value, state)
    ) : value ? (
      <BlobImage blobId={value} alt="" loading="lazy" />
    ) : null;

  const showClear = value !== null && !busy;
  const clearSlot =
    renderClear === null ? null : showClear ? (
      renderClear ? (
        renderClear({ clear: handleClear, disabled: disabled ?? false })
      ) : (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          data-granit-blob-upload-clear=""
        >
          Clear
        </button>
      )
    ) : null;

  return (
    <div
      data-granit-blob-upload=""
      data-phase={state.phase}
      data-busy={busy ? '' : undefined}
      className={className}
    >
      {preview ? <div data-granit-blob-upload-preview="">{preview}</div> : null}
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        disabled={disabled || busy}
        onChange={handleFileChange}
        data-granit-blob-upload-input=""
      />
      {clearSlot}
      {state.phase === 'uploading' ? (
        <progress
          value={state.progress}
          max={100}
          data-granit-blob-upload-progress=""
          aria-label="Upload progress"
        />
      ) : null}
      {validationError ? (
        <span role="alert" data-granit-blob-upload-error="" data-error-kind="validation">
          {validationError}
        </span>
      ) : state.phase === 'error' && state.error ? (
        <span role="alert" data-granit-blob-upload-error="" data-error-kind="upload">
          {state.error.message}
        </span>
      ) : null}
    </div>
  );
}
