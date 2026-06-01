import { useEffect, useMemo, useRef, useState } from 'react';

import { useDocument, useDocumentDownloadUrl } from '../hooks/use-documents';
import { useDocumentsConfig } from '../providers/documents-provider';

import { classifyDocumentName } from './document-kind';

import type { DocumentKind } from './document-kind';
import type { DocumentResponse } from '@granit/documents';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';

export interface DocumentQuickLookLabels {
  readonly title?: string;
  readonly close?: string;
  readonly download?: string;
  readonly previous?: string;
  readonly next?: string;
  readonly loading?: string;
  readonly loadingPreview?: string;
  readonly unsupportedKind?: (kind: DocumentKind) => string;
  readonly downloadToView?: string;
  readonly previewError?: string;
  readonly position?: (current: number, total: number) => string;
}

export interface DocumentQuickLookProps {
  /** Currently previewed document id. Pass `null` to keep the modal closed. */
  readonly documentId: string | null;
  readonly onClose: () => void;
  /**
   * Sibling documents (typically the current page of the list). When
   * supplied, `←` / `→` navigate through them and the header shows
   * "n / total". When omitted, navigation is disabled.
   */
  readonly siblings?: readonly DocumentResponse[];
  /** Called with a sibling id when the user navigates via `←` / `→`. */
  readonly onNavigate?: (documentId: string) => void;
  readonly labels?: DocumentQuickLookLabels;
  readonly className?: string;
}

const DEFAULT_LABELS: Required<DocumentQuickLookLabels> = {
  title: 'Preview',
  close: 'Close',
  download: 'Download',
  previous: 'Previous',
  next: 'Next',
  loading: 'Loading…',
  loadingPreview: 'Loading preview…',
  unsupportedKind: (kind) => `No preview available for ${kind} files.`,
  downloadToView: 'Download to view',
  previewError: 'Failed to load preview.',
  position: (current, total) => `${String(current)} / ${String(total)}`,
};

// Max bytes to inline-fetch + render in <pre>. Bigger files fall back to a
// "Download to view" message to avoid OOM in jsdom / weak clients.
const MAX_INLINE_TEXT_BYTES = 512 * 1024;

// Keys that count as a "text-like" preview (fetch URL → render as <pre>).
const TEXT_KINDS: ReadonlySet<DocumentKind> = new Set<DocumentKind>(['text', 'code']);

interface PreviewContent {
  readonly status: 'loading' | 'ready' | 'error' | 'too-large';
  readonly text?: string;
  readonly message?: string;
}

/**
 * Quick Look modal — full-viewport preview triggered by `Space` from the
 * documents list, mirroring macOS Finder. Renderer is dispatched on the
 * document's extension-based kind:
 *
 * - image     → `<img>`
 * - video     → `<video controls autoPlay>`
 * - audio     → `<audio controls autoPlay>`
 * - pdf       → `<iframe>` (browser-native PDF viewer)
 * - text/code → fetch the URL + render as `<pre>` (capped at 512 KB so we
 *               don't OOM on a 300 MB log; bigger files fall back to the
 *               download placeholder)
 * - other     → "Download to view" placeholder
 *
 * Sibling navigation is opt-in: pass `siblings` + `onNavigate` and `←` / `→`
 * walk the list (typically the current paged result). The modal uses the
 * native `<dialog>` element for focus trap + Esc to close, mounted via
 * portal so it escapes the explorer's grid container.
 */
export function DocumentQuickLook({
  documentId,
  onClose,
  siblings,
  onNavigate,
  labels,
  className,
}: DocumentQuickLookProps): ReactNode {
  const labelStrings = { ...DEFAULT_LABELS, ...labels };
  const config = useDocumentsConfig();
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Open / close the native <dialog> in sync with documentId so backdrop +
  // focus trap behaviors come for free.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (documentId && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        /* dialog already-open in jsdom corner cases */
      }
    } else if (!documentId && dialog.open) {
      dialog.close();
    }
  }, [documentId]);

  const docQuery = useDocument(documentId ?? '', { enabled: Boolean(documentId) });
  const urlQuery = useDocumentDownloadUrl(documentId ?? '', undefined, {
    enabled: Boolean(documentId),
  });

  const document = docQuery.data ?? null;
  const downloadUrl = urlQuery.data?.url ?? null;
  const kind = useMemo<DocumentKind>(
    () => (document ? classifyDocumentName(document.name) : 'other'),
    [document]
  );

  // For text-like kinds we pull the actual content via the presigned URL so
  // we can show a real preview (not just a download prompt). One fetch per
  // (documentId, url) — cancelled on unmount / id change.
  const [previewContent, setPreviewContent] = useState<PreviewContent | null>(null);
  useEffect(() => {
    if (!documentId || !downloadUrl || !TEXT_KINDS.has(kind)) {
      setPreviewContent(null);
      return;
    }
    setPreviewContent({ status: 'loading' });
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await config.client.get<string>(downloadUrl, {
          signal: controller.signal,
          responseType: 'text',
          transformResponse: (raw: unknown) => raw,
        });
        const text = String(response.data ?? '');
        if (text.length > MAX_INLINE_TEXT_BYTES) {
          setPreviewContent({ status: 'too-large' });
          return;
        }
        setPreviewContent({ status: 'ready', text });
      } catch (err) {
        if (controller.signal.aborted) return;
        setPreviewContent({
          status: 'error',
          message: err instanceof Error ? err.message : labelStrings.previewError,
        });
      }
    })();
    return () => controller.abort();
  }, [documentId, downloadUrl, kind, config.client, labelStrings.previewError]);

  const currentIndex = useMemo(() => {
    if (!siblings || !documentId) return -1;
    return siblings.findIndex((s) => s.id === documentId);
  }, [siblings, documentId]);

  function navigate(direction: -1 | 1): void {
    if (!siblings || !onNavigate || currentIndex === -1) return;
    const next = currentIndex + direction;
    if (next < 0 || next >= siblings.length) return;
    const sibling = siblings[next];
    if (sibling) onNavigate(sibling.id);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDialogElement>): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      navigate(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      navigate(1);
    }
  }

  function handleDownload(): void {
    if (!downloadUrl || typeof globalThis.window === 'undefined') return;
    globalThis.window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  }

  // Rendered even when documentId is null so the <dialog> ref stays mounted
  // and the open/close effect can drive it. Native <dialog> + `showModal()`
  // uses the browser's top-layer, so we don't need a portal to escape
  // `overflow: hidden` ancestors — the modal floats above all other content.
  return (
    <dialog
      ref={dialogRef}
      data-granit-document-quick-look=""
      data-granit-document-quick-look-kind={kind}
      aria-label={labelStrings.title}
      className={className}
      onClose={onClose}
      onCancel={onClose}
      onKeyDown={handleKeyDown}
    >
      <header data-granit-document-quick-look-header="">
        <span data-granit-document-quick-look-name="">
          {document?.name ?? labelStrings.loading}
        </span>
        {siblings && currentIndex !== -1 && (
          <span data-granit-document-quick-look-position="">
            {labelStrings.position(currentIndex + 1, siblings.length)}
          </span>
        )}
        <div data-granit-document-quick-look-actions="">
          {siblings && onNavigate && (
            <>
              <button
                type="button"
                data-granit-document-quick-look-prev=""
                aria-label={labelStrings.previous}
                disabled={currentIndex <= 0}
                onClick={() => navigate(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                data-granit-document-quick-look-next=""
                aria-label={labelStrings.next}
                disabled={currentIndex === -1 || currentIndex >= siblings.length - 1}
                onClick={() => navigate(1)}
              >
                ›
              </button>
            </>
          )}
          <button
            type="button"
            data-granit-document-quick-look-download=""
            disabled={!downloadUrl}
            onClick={handleDownload}
          >
            {labelStrings.download}
          </button>
          <button
            type="button"
            data-granit-document-quick-look-close=""
            aria-label={labelStrings.close}
            onClick={onClose}
          >
            ×
          </button>
        </div>
      </header>
      <div data-granit-document-quick-look-body="">
        {!documentId || !document ? (
          <div data-granit-document-quick-look-loading="">{labelStrings.loading}</div>
        ) : urlQuery.isError ? (
          <div data-granit-document-quick-look-error="" role="alert">
            {labelStrings.previewError}
          </div>
        ) : !downloadUrl ? (
          <div data-granit-document-quick-look-loading="">{labelStrings.loadingPreview}</div>
        ) : kind === 'image' ? (
          <img data-granit-document-quick-look-image="" src={downloadUrl} alt={document.name} />
        ) : kind === 'video' ? (
          <video data-granit-document-quick-look-video="" src={downloadUrl} controls autoPlay />
        ) : kind === 'audio' ? (
          <audio data-granit-document-quick-look-audio="" src={downloadUrl} controls autoPlay />
        ) : kind === 'pdf' ? (
          <iframe data-granit-document-quick-look-pdf="" src={downloadUrl} title={document.name} />
        ) : TEXT_KINDS.has(kind) ? (
          previewContent?.status === 'loading' ? (
            <div data-granit-document-quick-look-loading="">{labelStrings.loadingPreview}</div>
          ) : previewContent?.status === 'ready' ? (
            <pre data-granit-document-quick-look-text="">{previewContent.text}</pre>
          ) : previewContent?.status === 'too-large' ? (
            <div data-granit-document-quick-look-fallback="">{labelStrings.downloadToView}</div>
          ) : (
            <div data-granit-document-quick-look-error="" role="alert">
              {previewContent?.message ?? labelStrings.previewError}
            </div>
          )
        ) : (
          <div data-granit-document-quick-look-fallback="">
            <p>{labelStrings.unsupportedKind(kind)}</p>
            <p>{labelStrings.downloadToView}</p>
          </div>
        )}
      </div>
    </dialog>
  );
}
