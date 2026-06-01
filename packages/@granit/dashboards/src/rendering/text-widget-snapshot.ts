import type { WidgetSnapshotEnvelope, WidgetSnapshotEnvelopeOf } from './widget-snapshot-envelope';
import type { TextWidgetStyle } from '../types/widget-definition';

/**
 * Wire-shape snapshot for the `'Text'` widget kind — a plain-text tile
 * (page heading, section subheading, caption) with no data binding. Mirrors
 * `Granit.Dashboards.Endpoints.Rendering.TextWidgetSnapshot` (B3-3, ADR-039)
 * one-to-one with `TextWidgetDefinition` — the frontend resolves the
 * localization key against the active culture.
 */
export interface TextWidgetSnapshot {
  /** Localization key for the text body. */
  readonly contentLocalizationKey: string;
  /** Visual style hint inherited from the declarative definition. */
  readonly style: TextWidgetStyle;
}

/** Narrowed {@link WidgetSnapshotEnvelope} for the `'Text'` widget kind. */
export type TextSnapshotEnvelope = WidgetSnapshotEnvelopeOf<'Text', TextWidgetSnapshot>;

/** Type guard refining a generic envelope to {@link TextSnapshotEnvelope}. */
export function isTextSnapshotEnvelope(
  envelope: WidgetSnapshotEnvelope
): envelope is TextSnapshotEnvelope {
  return envelope.widgetType === 'Text';
}
