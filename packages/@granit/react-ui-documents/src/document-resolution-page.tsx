import { formatBytes, useBatchResolveDocumentAssets } from '@granit/react-documents';
import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { useState } from 'react';

export function DocumentResolutionPage() {
  const { t } = useTranslation();
  const resolve = useBatchResolveDocumentAssets();
  const [idsInput, setIdsInput] = useState('');

  function handleResolve() {
    const ids = idsInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (ids.length === 0) return;
    resolve.mutate({
      requests: ids.map((documentId) => ({ documentId })),
    });
  }

  return (
    <div data-slot="document-resolution-page" className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('documents:Resolution.Title', 'Asset Resolution')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            'documents:Resolution.Subtitle',
            'Batch-resolve document IDs to presigned CDN URLs. Used by the CMS renderer to embed document assets without per-document API calls.'
          )}
        </p>
      </header>

      <section className="space-y-3">
        <label htmlFor="res-ids" className="block text-sm font-medium text-foreground">
          {t('documents:Resolution.IdsLabel', 'Document IDs (one per line or comma-separated)')}
        </label>
        <textarea
          id="res-ids"
          rows={5}
          value={idsInput}
          onChange={(e) => setIdsInput(e.target.value)}
          placeholder={t('documents:Resolution.IdsPlaceholder', 'doc-1\ndoc-2\ndoc-3')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          type="button"
          onClick={handleResolve}
          disabled={resolve.isPending || idsInput.trim().length === 0}
        >
          {resolve.isPending
            ? t('documents:Resolution.Resolving', 'Resolving…')
            : t('documents:Resolution.Resolve', 'Resolve')}
        </Button>
      </section>

      {resolve.error && (
        <p className="text-sm text-destructive">
          {t('documents:Resolution.Error', 'Resolution failed.')}
        </p>
      )}

      {resolve.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t(
            'documents:Resolution.Empty',
            'No assets resolved. Check that the document IDs exist and have a current version.'
          )}
        </p>
      )}

      {resolve.data && resolve.data.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            {t('documents:Resolution.Results', 'Resolved assets ({{count}})', {
              count: resolve.data.length,
            })}
          </h3>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    {t('documents:Resolution.Header.DocumentId', 'Document ID')}
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    {t('documents:Resolution.Header.MimeType', 'MIME type')}
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    {t('documents:Resolution.Header.Dimensions', 'Dimensions')}
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    {t('documents:Resolution.Header.Size', 'Size')}
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    {t('documents:Resolution.Header.URL', 'URL')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {resolve.data.map((item) => (
                  <tr key={`${item.documentId}-${item.versionId ?? ''}`}>
                    <td className="px-4 py-2 font-mono text-xs">{item.documentId}</td>
                    <td className="px-4 py-2 text-muted-foreground">{item.mimeType}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {item.width !== null &&
                      item.width !== undefined &&
                      item.height !== null &&
                      item.height !== undefined
                        ? `${String(item.width)} × ${String(item.height)}`
                        : '—'}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {item.sizeBytes !== null && item.sizeBytes !== undefined
                        ? formatBytes(item.sizeBytes)
                        : '—'}
                    </td>
                    <td className="px-4 py-2 max-w-xs truncate">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-2 hover:underline text-xs font-mono"
                      >
                        {item.url}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
