import type { WidgetSnapshotEnvelope, WidgetSnapshotEnvelopeOf } from './widget-snapshot-envelope';
import type { ImageFit } from '../types/widget-definition';

/**
 * Wire-shape snapshot for the `'Image'` widget kind — a static image tile
 * (logo, illustration, banner). Mirrors
 * `Granit.Dashboards.Endpoints.Rendering.ImageWidgetSnapshot` (B3-3,
 * ADR-039). The frontend resolves blob references (`'blob:...'`) and the
 * alt-text localization key against the active session and culture.
 */
export interface ImageWidgetSnapshot {
  /** URL or blob reference (`'blob:logo-banner'`, `'https://cdn...'`). */
  readonly source: string;
  /** Localization key for the alt text (accessibility). */
  readonly altLocalizationKey: string;
  /** How the image fills its grid cell. */
  readonly fit: ImageFit;
}

/** Narrowed {@link WidgetSnapshotEnvelope} for the `'Image'` widget kind. */
export type ImageSnapshotEnvelope = WidgetSnapshotEnvelopeOf<'Image', ImageWidgetSnapshot>;

/** Type guard refining a generic envelope to {@link ImageSnapshotEnvelope}. */
export function isImageSnapshotEnvelope(
  envelope: WidgetSnapshotEnvelope
): envelope is ImageSnapshotEnvelope {
  return envelope.widgetType === 'Image';
}
