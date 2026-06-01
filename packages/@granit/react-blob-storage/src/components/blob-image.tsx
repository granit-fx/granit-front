import { useGranitClient } from '@granit/react-api-client';
import { useEffect, useState, type ImgHTMLAttributes, type ReactNode } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

export interface BlobImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /**
   * Stable identifier of the blob to render. `null` / `undefined` are
   * treated the same as a load failure: the `fallback` is rendered (or
   * nothing, if no fallback is supplied) so callers don't have to
   * special-case missing avatars / images.
   */
  readonly blobId: string | null | undefined;
  /**
   * Rendered when `blobId` is `null` / `undefined` OR when the underlying
   * `<img>` fails to load. `null` / undefined fallback renders nothing
   * — apps that prefer a CSS-only placeholder rely on the parent's
   * background / `[data-blob-image-empty]` selector.
   */
  readonly fallback?: ReactNode;
  /**
   * Override the URL strategy. Default builds
   * `${client.defaults.baseURL}/api/v1/blob-storage/blobs/{id}/download`,
   * which works for hosts running behind a BFF that authenticates via
   * cookie. Bearer / direct-S3 hosts pass an async resolver that calls
   * `useDownloadUrl` (or any custom presign) and returns the URL.
   */
  readonly resolveUrl?: (blobId: string) => string | Promise<string>;
  /**
   * Override the BFF base path. Defaults to `/api/v1/blob-storage`. Only
   * relevant when `resolveUrl` is omitted (the default path-builder
   * uses it).
   */
  readonly basePath?: string;
}

/**
 * Renders an `<img>` for a `BlobReference`. Replaces the manual
 * `${baseUrl}/api/v1/blob-storage/blobs/{id}/download` URL composition
 * + `MutationObserver` decoration patterns hosts had to write before:
 * apps drop a `<BlobImage blobId={…} />` and the framework owns auth,
 * URL composition, lazy loading, and error fallback.
 *
 * Default URL strategy (BFF / cookie auth):
 *
 * ```tsx
 * <BlobImage blobId={party.avatarBlobId} fallback={<UserIcon />} />
 * ```
 *
 * Override for bearer / pre-signed URLs:
 *
 * ```tsx
 * const downloadUrl = useDownloadUrl({ client });
 * <BlobImage
 *   blobId={blob.id}
 *   resolveUrl={async (id) =>
 *     (await downloadUrl.mutateAsync({ id, request: { containerName: 'docs' } }))
 *       .downloadUrl
 *   }
 * />
 * ```
 *
 * The component reads the host's axios client via `useGranitClient()`
 * to derive the default `baseURL`; all other `<img>` HTML attributes
 * (`alt`, `className`, `loading`, `width` / `height`, `onClick`, …)
 * pass through unchanged. `loading="lazy"` defaults so off-screen
 * gallery cards don't trigger a network call until they scroll into
 * view.
 */
export function BlobImage({
  blobId,
  fallback,
  resolveUrl,
  basePath = DEFAULT_BASE_PATH,
  loading = 'lazy',
  ...imgProps
}: BlobImageProps): ReactNode {
  const client = useGranitClient();
  const [resolved, setResolved] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
    if (!blobId) {
      setResolved(null);
      return;
    }
    let cancelled = false;

    if (resolveUrl) {
      const result = resolveUrl(blobId);
      if (typeof result === 'string') {
        setResolved(result);
      } else {
        setResolved(null);
        result.then((url) => {
          if (!cancelled) setResolved(url);
        });
      }
    } else {
      const baseURL = client.defaults.baseURL ?? '';
      setResolved(`${baseURL}${basePath}/blobs/${encodeURIComponent(blobId)}/download`);
    }

    return () => {
      cancelled = true;
    };
  }, [blobId, resolveUrl, basePath, client]);

  if (!blobId || errored || !resolved) {
    return <>{fallback ?? null}</>;
  }

  return (
    <img
      alt=""
      {...imgProps}
      src={resolved}
      loading={loading}
      onError={(event) => {
        setErrored(true);
        imgProps.onError?.(event);
      }}
    />
  );
}
