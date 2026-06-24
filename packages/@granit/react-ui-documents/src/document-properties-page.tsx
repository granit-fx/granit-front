import { useDocumentProperties } from '@granit/react-documents';
import { useDateFormatter, useTranslation } from '@granit/react-localization';
import { Alert, AlertDescription } from '@granit/react-ui';
import { useParams } from 'react-router-dom';

function Row({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string | number | null | undefined;
}) {
  if (value === null || value === undefined) return null;
  return (
    <>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{String(value)}</dd>
    </>
  );
}

export function DocumentPropertiesPage() {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const { id } = useParams<{ id: string }>();
  const props = useDocumentProperties(id ?? '');

  if (!id) {
    return (
      <div data-slot="document-properties-page" className="space-y-6">
        <p className="text-sm text-muted-foreground">
          {t('documents:Properties.NotFound', 'Document not found.')}
        </p>
      </div>
    );
  }

  return (
    <div data-slot="document-properties-page" className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('documents:Properties.Title', 'Document Properties')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            'documents:Properties.Subtitle',
            'Extracted metadata from the current version of the document.'
          )}
        </p>
      </header>

      {props.isLoading && (
        <p className="text-sm text-muted-foreground">
          {t('documents:Properties.Loading', 'Loading properties…')}
        </p>
      )}

      {props.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {t('documents:Properties.Error', 'Failed to load properties.')}
          </AlertDescription>
        </Alert>
      )}

      {props.data && (
        <div className="space-y-6">
          <section className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t('documents:Properties.Section.General', 'General')}
            </h3>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2">
              <Row label={t('documents:Properties.Status', 'Status')} value={props.data.status} />
              <Row
                label={t('documents:Properties.ContentType', 'Source content type')}
                value={props.data.sourceContentType}
              />
              <Row
                label={t('documents:Properties.ExtractorCount', 'Extractors run')}
                value={props.data.extractorCount}
              />
              <Row
                label={t('documents:Properties.CompletedAt', 'Completed at')}
                value={props.data.completedAt ? formatDateTime(props.data.completedAt) : null}
              />
              {props.data.failureReason && (
                <Row
                  label={t('documents:Properties.FailureReason', 'Failure reason')}
                  value={props.data.failureReason}
                />
              )}
            </dl>
          </section>

          {(props.data.width ??
            props.data.height ??
            props.data.cameraMake ??
            props.data.takenAt) !== undefined && (
            <section className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t('documents:Properties.Section.Image', 'Image')}
              </h3>
              <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2">
                <Row label={t('documents:Properties.Width', 'Width')} value={props.data.width} />
                <Row label={t('documents:Properties.Height', 'Height')} value={props.data.height} />
                <Row
                  label={t('documents:Properties.CameraMake', 'Camera make')}
                  value={props.data.cameraMake}
                />
                <Row
                  label={t('documents:Properties.CameraModel', 'Camera model')}
                  value={props.data.cameraModel}
                />
                <Row
                  label={t('documents:Properties.LensModel', 'Lens model')}
                  value={props.data.lensModel}
                />
                <Row label={t('documents:Properties.ISO', 'ISO')} value={props.data.iso} />
                <Row
                  label={t('documents:Properties.FNumber', 'f-number')}
                  value={props.data.fNumber}
                />
                <Row
                  label={t('documents:Properties.ExposureTimeMs', 'Exposure (ms)')}
                  value={props.data.exposureTimeMs}
                />
                <Row
                  label={t('documents:Properties.TakenAt', 'Taken at')}
                  value={props.data.takenAt ? formatDateTime(props.data.takenAt) : null}
                />
                <Row
                  label={t('documents:Properties.GPS', 'GPS')}
                  value={
                    props.data.gpsLatitude !== null &&
                    props.data.gpsLatitude !== undefined &&
                    props.data.gpsLongitude !== null &&
                    props.data.gpsLongitude !== undefined
                      ? `${String(props.data.gpsLatitude)}, ${String(props.data.gpsLongitude)}`
                      : undefined
                  }
                />
              </dl>
            </section>
          )}

          {(props.data.pageCount ?? props.data.title ?? props.data.author) !== undefined && (
            <section className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t('documents:Properties.Section.Document', 'Document')}
              </h3>
              <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2">
                <Row
                  label={t('documents:Properties.PageCount', 'Page count')}
                  value={props.data.pageCount}
                />
                <Row label={t('documents:Properties.Title', 'Title')} value={props.data.title} />
                <Row label={t('documents:Properties.Author', 'Author')} value={props.data.author} />
                <Row
                  label={t('documents:Properties.Subject', 'Subject')}
                  value={props.data.subject}
                />
                <Row
                  label={t('documents:Properties.Keywords', 'Keywords')}
                  value={props.data.keywords}
                />
                <Row
                  label={t('documents:Properties.Producer', 'Producer')}
                  value={props.data.producer}
                />
                <Row
                  label={t('documents:Properties.Revision', 'Revision')}
                  value={props.data.revision}
                />
              </dl>
            </section>
          )}

          {(props.data.durationMs ?? props.data.codec ?? props.data.artist) !== undefined && (
            <section className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t('documents:Properties.Section.Media', 'Media')}
              </h3>
              <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2">
                <Row
                  label={t('documents:Properties.DurationMs', 'Duration (ms)')}
                  value={props.data.durationMs}
                />
                <Row label={t('documents:Properties.Codec', 'Codec')} value={props.data.codec} />
                <Row
                  label={t('documents:Properties.Bitrate', 'Bitrate')}
                  value={props.data.bitrate}
                />
                <Row label={t('documents:Properties.Artist', 'Artist')} value={props.data.artist} />
                <Row label={t('documents:Properties.Album', 'Album')} value={props.data.album} />
                <Row
                  label={t('documents:Properties.TrackNumber', 'Track')}
                  value={props.data.trackNumber}
                />
                <Row label={t('documents:Properties.Genre', 'Genre')} value={props.data.genre} />
              </dl>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
