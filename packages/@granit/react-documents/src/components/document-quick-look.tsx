import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDocument, useDocumentDownloadUrl } from '../hooks/use-documents';
import { useDocumentsConfig } from '../providers/documents-provider';

import { classifyDocumentName } from './document-kind';

import type { DocumentKind } from './document-kind';
import type { DocumentResponse } from '@granit/documents';
import type { ReactNode } from 'react';

// Keys that count as a "text-like" preview (fetch URL → render as <pre>).
const TEXT_KINDS: ReadonlySet<DocumentKind> = new Set<DocumentKind>(['text', 'code']);

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

interface PreviewContent {
  readonly status: 'loading' | 'ready' | 'error' | 'too-large';
  readonly text?: string;
  readonly message?: string;
}

interface QuickLookPreviewProps {
  readonly kind: DocumentKind;
  readonly downloadUrl: string;
  readonly documentName: string;
  readonly previewContent: PreviewContent | null;
  readonly labelStrings: Required<DocumentQuickLookLabels>;
}

function QuickLookPreview({
  kind,
  downloadUrl,
  documentName,
  previewContent,
  labelStrings,
}: QuickLookPreviewProps): ReactNode {
  if (kind === 'image') {
    return <img data-granit-document-quick-look-image="" src={downloadUrl} alt={documentName} />;
  }
  if (kind === 'video') {
    return (
      <video data-granit-document-quick-look-video="" src={downloadUrl} controls autoPlay>
        <track kind="captions" />
      </video>
    );
  }
  if (kind === 'audio') {
    return (
      <audio data-granit-document-quick-look-audio="" src={downloadUrl} controls autoPlay>
        <track kind="captions" />
      </audio>
    );
  }
  if (kind === 'pdf') {
    return <iframe data-granit-document-quick-look-pdf="" src={downloadUrl} title={documentName} />;
  }
  if (TEXT_KINDS.has(kind)) {
    if (previewContent?.status === 'loading') {
      return <div data-granit-document-quick-look-loading="">{labelStrings.loadingPreview}</div>;
    }
    if (previewContent?.status === 'ready') {
      return <pre data-granit-document-quick-look-text="">{previewContent.text}</pre>;
    }
    if (previewContent?.status === 'too-large') {
      return <div data-granit-document-quick-look-fallback="">{labelStrings.downloadToView}</div>;
    }
    return (
      <div data-granit-document-quick-look-error="" role="alert">
        {previewContent?.message ?? labelStrings.previewError}
      </div>
    );
  }
  return (
    <div data-granit-document-quick-look-fallback="">
      <p>{labelStrings.unsupportedKind(kind)}</p>
      <p>{labelStrings.downloadToView}</p>
    </div>
  );
}

interface QuickLookHeaderProps {
  readonly documentName: string | undefined;
  readonly siblings: readonly DocumentResponse[] | undefined;
  readonly currentIndex: number;
  readonly downloadUrl: string | null;
  readonly onNavigate: ((documentId: string) => void) | undefined;
  readonly onClose: () => void;
  readonly onDownload: () => void;
  readonly navigate: (direction: -1 | 1) => void;
  readonly labelStrings: Required<DocumentQuickLookLabels>;
}

function QuickLookHeader({
  documentName,
  siblings,
  currentIndex,
  downloadUrl,
  onNavigate,
  onClose,
  onDownload,
  navigate,
  labelStrings,
}: QuickLookHeaderProps): ReactNode {
  return (
    <header data-granit-document-quick-look-header="">
      <span data-granit-document-quick-look-name="">{documentName ?? labelStrings.loading}</span>
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
          onClick={onDownload}
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
  );
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

  const navigate = useCallback(
    (direction: -1 | 1): void => {
      if (!siblings || !onNavigate || currentIndex === -1) return;
      const next = currentIndex + direction;
      if (next < 0 || next >= siblings.length) return;
      const sibling = siblings[next];
      if (sibling) onNavigate(sibling.id);
    },
    [siblings, onNavigate, currentIndex]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigate(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        navigate(1);
      }
    },
    [navigate]
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  function handleDownload(): void {
    if (!downloadUrl || globalThis.window === undefined) return;
    globalThis.window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  }

  let previewBody: ReactNode;
  if (!documentId || !document) {
    previewBody = <div data-granit-document-quick-look-loading="">{labelStrings.loading}</div>;
  } else if (urlQuery.isError) {
    previewBody = (
      <div data-granit-document-quick-look-error="" role="alert">
        {labelStrings.previewError}
      </div>
    );
  } else if (downloadUrl === null) {
    previewBody = (
      <div data-granit-document-quick-look-loading="">{labelStrings.loadingPreview}</div>
    );
  } else {
    previewBody = (
      <QuickLookPreview
        kind={kind}
        downloadUrl={downloadUrl}
        documentName={document.name}
        previewContent={previewContent}
        labelStrings={labelStrings}
      />
    );
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
    >
      <QuickLookHeader
        documentName={document?.name}
        siblings={siblings}
        currentIndex={currentIndex}
        downloadUrl={downloadUrl}
        onNavigate={onNavigate}
        onClose={onClose}
        onDownload={handleDownload}
        navigate={navigate}
        labelStrings={labelStrings}
      />
      <div data-granit-document-quick-look-body="">{previewBody}</div>
    </dialog>
  );
}
