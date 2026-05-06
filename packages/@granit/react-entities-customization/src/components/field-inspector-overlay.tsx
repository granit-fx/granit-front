import type { ReactNode } from 'react';

/**
 * The 5-layer resolution hierarchy from ADR-053 §4. The order is fixed —
 * highest precedence first: a Layer 1 (admin) override beats a Layer 5
 * (schema default) when both apply.
 *
 *  1. Layer1Admin     — tenant admin's customization (this package)
 *  2. Layer2Workspace — workspace-scoped override
 *  3. Layer3Role      — role-scoped override
 *  4. Layer4User      — per-user preference
 *  5. Layer5Schema    — code-declared default
 */
export type ResolutionLayer =
  | 'Layer1Admin'
  | 'Layer2Workspace'
  | 'Layer3Role'
  | 'Layer4User'
  | 'Layer5Schema';

export const RESOLUTION_LAYERS: readonly ResolutionLayer[] = Object.freeze([
  'Layer1Admin',
  'Layer2Workspace',
  'Layer3Role',
  'Layer4User',
  'Layer5Schema',
]);

/** A single contributing source for a field's effective layout. */
export interface FieldResolutionEntry {
  readonly layer: ResolutionLayer;
  /** Was this layer the winning source for the effective value? */
  readonly winning: boolean;
  /** Free-form description of what this layer contributed (e.g. "Hidden"). */
  readonly summary: string;
}

export interface FieldInspectorOverlayLabels {
  readonly title?: (fieldName: string) => string;
  readonly winningTag?: string;
  readonly close?: string;
  readonly layerLabel?: (layer: ResolutionLayer) => string;
}

const DEFAULT_LABELS: Required<FieldInspectorOverlayLabels> = {
  title: (fieldName) => `Resolution chain — ${fieldName}`,
  winningTag: 'winning',
  close: 'Close',
  layerLabel: (layer) => layer,
};

export interface FieldInspectorOverlayProps {
  readonly fieldName: string;
  /**
   * One entry per layer. Callers that don't have data for a layer should
   * still pass it (with a `summary` like "—") so the overlay shows the
   * full 5-row resolution chain — that's the anti-Frappe guarantee.
   */
  readonly entries: readonly FieldResolutionEntry[];
  readonly onClose?: () => void;
  readonly labels?: FieldInspectorOverlayLabels;
  readonly className?: string;
}

/**
 * Headless 5-layer resolution debug overlay. Presents one row per layer
 * with its summary and a `winning` badge on the layer that produced the
 * effective value.
 *
 * No design-system chrome: apps style via `data-granit-field-inspector*`
 * markers and host the overlay in their own modal/popover. The component
 * itself is a `<dialog open>` so screen readers announce it correctly.
 */
export function FieldInspectorOverlay({
  fieldName,
  entries,
  onClose,
  labels,
  className,
}: FieldInspectorOverlayProps): ReactNode {
  const merged = { ...DEFAULT_LABELS, ...labels };
  return (
    <dialog
      open
      data-granit-field-inspector=""
      data-field-name={fieldName}
      className={className}
      aria-label={merged.title(fieldName)}
    >
      <header data-granit-field-inspector-header="">
        <h2 data-granit-field-inspector-title="">{merged.title(fieldName)}</h2>
        {onClose !== undefined ? (
          <button
            type="button"
            data-granit-field-inspector-close=""
            onClick={onClose}
            aria-label={merged.close}
          >
            {merged.close}
          </button>
        ) : null}
      </header>
      <ol data-granit-field-inspector-layers="">
        {RESOLUTION_LAYERS.map((layer) => {
          const entry = entries.find((e) => e.layer === layer);
          return (
            <li
              key={layer}
              data-granit-field-inspector-layer=""
              data-layer={layer}
              data-winning={entry?.winning ? '' : undefined}
            >
              <span data-granit-field-inspector-layer-label="">{merged.layerLabel(layer)}</span>
              <span data-granit-field-inspector-layer-summary="">{entry?.summary ?? '—'}</span>
              {entry?.winning ? (
                <span data-granit-field-inspector-winning="">{merged.winningTag}</span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </dialog>
  );
}
