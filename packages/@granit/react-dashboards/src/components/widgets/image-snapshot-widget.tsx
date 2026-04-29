import { isImageSnapshotEnvelope } from '@granit/dashboards';
import { useTranslation } from 'react-i18next';

import type { DashboardRenderedWidget, ImageFit } from '@granit/dashboards';
import type { CSSProperties } from 'react';

const OBJECT_FIT: Readonly<Record<ImageFit, NonNullable<CSSProperties['objectFit']>>> = {
  Contain: 'contain',
  Cover: 'cover',
  Fill: 'fill',
};

/**
 * Built-in snapshot renderer for the `'Image'` widget kind. Symmetric to the
 * definition-side {@link ImageWidget}: native `<img>` (no router-aware loader
 * dependency) with `loading="lazy"` and `object-fit` mapped from the
 * snapshot's {@link ImageFit}.
 */
export function ImageSnapshotWidget({ widget }: { readonly widget: DashboardRenderedWidget }) {
  const { t } = useTranslation();
  if (!isImageSnapshotEnvelope(widget) || !widget.snapshot) return null;
  const { source, altLocalizationKey, fit } = widget.snapshot;
  const alt = t(altLocalizationKey, { defaultValue: altLocalizationKey });
  return (
    <div
      data-slot="image-snapshot-widget"
      className="flex h-full w-full items-center justify-center"
    >
      <img
        src={source}
        alt={alt}
        loading="lazy"
        style={{ objectFit: OBJECT_FIT[fit] }}
        className="h-full w-full"
      />
    </div>
  );
}
