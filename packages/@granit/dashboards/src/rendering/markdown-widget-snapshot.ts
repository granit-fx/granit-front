import type {
  WidgetSnapshotEnvelope,
  WidgetSnapshotEnvelopeOf,
} from './widget-snapshot-envelope.js';

/**
 * Wire-shape snapshot for the `'Markdown'` widget kind. Carries the
 * localization key the frontend resolves to a markdown body — the renderer
 * itself never resolves the key (the active locale lives on the client and
 * the localization bundle ships separately), so the snapshot stays static
 * regardless of the requesting user's culture.
 *
 * Mirrors `Granit.Dashboards.Endpoints.Rendering.MarkdownWidgetSnapshot`
 * (B3-3, ADR-039).
 */
export interface MarkdownWidgetSnapshot {
  /** Localization key whose value is the markdown body. */
  readonly contentLocalizationKey: string;
}

/**
 * Narrowed {@link WidgetSnapshotEnvelope} for the `'Markdown'` widget kind.
 * Use the {@link isMarkdownSnapshotEnvelope} type guard to refine a
 * heterogeneous dashboard render response to Markdown envelopes only.
 */
export type MarkdownSnapshotEnvelope = WidgetSnapshotEnvelopeOf<'Markdown', MarkdownWidgetSnapshot>;

/** Type guard refining a generic envelope to {@link MarkdownSnapshotEnvelope}. */
export function isMarkdownSnapshotEnvelope(
  envelope: WidgetSnapshotEnvelope
): envelope is MarkdownSnapshotEnvelope {
  return envelope.widgetType === 'Markdown';
}
