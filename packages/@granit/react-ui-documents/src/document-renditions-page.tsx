import {
  formatBytes,
  useDocumentRenditions,
  useRenditionDownloadUrl,
} from '@granit/react-documents';
import { useTranslation } from '@granit/react-localization';
import { Alert, AlertDescription, Button } from '@granit/react-ui';
import { useParams } from 'react-router-dom';

import type { RenditionResponse, RenditionType } from '@granit/documents';

function RenditionDownloadButton({
  documentId,
  type,
}: {
  readonly documentId: string;
  readonly type: RenditionType;
}) {
  const { t } = useTranslation();
  const downloadUrl = useRenditionDownloadUrl(documentId, type, { enabled: false });

  async function handleClick() {
    const result = await downloadUrl.refetch();
    if (result.data && globalThis.window !== undefined) {
      globalThis.open(result.data.url, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={downloadUrl.isFetching}
      onClick={() => {
        void handleClick();
      }}
    >
      {downloadUrl.isFetching
        ? t('documents:Renditions.Fetching', 'Fetching…')
        : t('documents:Renditions.Download', 'Download')}
    </Button>
  );
}

function statusBadge(status: RenditionResponse['status']): string {
  switch (status) {
    case 'Ready':
      return 'text-success-600 bg-success-100 ring-success-500/20';
    case 'Generating':
      return 'text-primary bg-primary/10 ring-primary/20';
    case 'Failed':
      return 'text-alert-700 bg-alert-50 ring-alert-500/20';
    default:
      return 'text-muted-foreground bg-muted ring-border';
  }
}

export function DocumentRenditionsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const renditions = useDocumentRenditions(id ?? '');

  if (!id) {
    return (
      <div data-slot="document-renditions-page" className="space-y-6">
        <p className="text-sm text-muted-foreground">
          {t('documents:Renditions.NotFound', 'Document not found.')}
        </p>
      </div>
    );
  }

  return (
    <div data-slot="document-renditions-page" className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('documents:Renditions.Title', 'Renditions')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            'documents:Renditions.Subtitle',
            'Automatically generated format variants (thumbnail, web-optimised, print-ready, poster).'
          )}
        </p>
      </header>

      {renditions.isLoading && (
        <p className="text-sm text-muted-foreground">
          {t('documents:Renditions.Loading', 'Loading renditions…')}
        </p>
      )}

      {renditions.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {t('documents:Renditions.Error', 'Failed to load renditions.')}
          </AlertDescription>
        </Alert>
      )}

      {renditions.data?.renditions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t('documents:Renditions.Empty', 'No renditions available.')}
        </p>
      )}

      {renditions.data && renditions.data.renditions.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  {t('documents:Renditions.Header.Type', 'Type')}
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  {t('documents:Renditions.Header.Format', 'Format')}
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  {t('documents:Renditions.Header.Status', 'Status')}
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  {t('documents:Renditions.Header.Dimensions', 'Dimensions')}
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  {t('documents:Renditions.Header.Size', 'Size')}
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {renditions.data.renditions.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 font-medium">{r.type}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.format}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusBadge(r.status)}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {r.width !== null &&
                    r.width !== undefined &&
                    r.height !== null &&
                    r.height !== undefined
                      ? `${String(r.width)} × ${String(r.height)}`
                      : '—'}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {r.sizeBytes !== null && r.sizeBytes !== undefined
                      ? formatBytes(r.sizeBytes)
                      : '—'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {r.status === 'Ready' && (
                      <RenditionDownloadButton documentId={id} type={r.type as RenditionType} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {renditions.data && (
        <p className="text-xs text-muted-foreground">
          {t('documents:Renditions.VersionId', 'Version: {{versionId}}', {
            versionId: renditions.data.documentVersionId,
          })}
        </p>
      )}
    </div>
  );
}
