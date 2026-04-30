import { useMemo, type ReactNode } from 'react';

import { useEntityRenderer } from '../provider/entity-renderer-provider.js';

import type {
  EntityDetailManifest,
  EntityDetailSectionManifest,
  EntityDetailSidePanelManifest,
} from '@granit/entities';

export interface EntityDetailProps {
  /** Detail variant from the manifest (one of `manifest.details`). */
  readonly variant: EntityDetailManifest;
  /** Current entity values keyed by PascalCase property name. */
  readonly values: Readonly<Record<string, unknown>>;
  /**
   * Optional class for the root element. The root layout is a
   * `<article>` containing the section column + side-panel rail; apps
   * style them via this className + the `data-granit-*` attributes.
   */
  readonly className?: string;
}

/**
 * Read-mode renderer driven by an `EntityDetailManifest`. Sections sorted
 * by `order`, fields rendered as `<dt>` / `<dd>` rows, side-panel slots
 * emitted as `<aside data-kind="...">` placeholders so apps can mount the
 * actual panel components (Audit / Timeline / Comments / Documents /
 * Activities) at the right position via DOM-based composition.
 *
 * **Skeleton scope** — supports free-form `section.fields` only. When
 * `section.inheritsFromFormVariant` is set, the section renders a TODO
 * marker (`<div data-granit-detail-inherits>`) that the
 * [inheritsFromFormVariant story](https://github.com/granit-fx/granit-front/issues/299)
 * will replace with the inherited form-variant rendering. Side-panel
 * slots are placeholders pending the rail registry story.
 *
 * Values are displayed via `String(value)`, with `null` / `undefined`
 * collapsed to `'—'`. A read-mode widget catalog (currency / date / link
 * formatting) is a follow-up — for now apps that need richer rendering
 * wrap or replace the row component via DOM substitution.
 */
export function EntityDetail({ variant, values, className }: EntityDetailProps): ReactNode {
  const sortedSections = useMemo(
    () => [...variant.sections].sort((a, b) => a.order - b.order),
    [variant.sections]
  );
  const sortedSidePanels = useMemo(
    () => [...variant.sidePanels].sort((a, b) => a.order - b.order),
    [variant.sidePanels]
  );

  return (
    <article data-granit-entity-detail="" data-variant={variant.name} className={className}>
      <div data-granit-detail-sections="">
        {sortedSections.map((section) => (
          <EntityDetailSection key={section.key} section={section} values={values} />
        ))}
      </div>
      {sortedSidePanels.length > 0 ? (
        <aside data-granit-detail-rail="">
          {sortedSidePanels.map((panel) => (
            <EntityDetailSidePanelSlot key={panel.kind} panel={panel} />
          ))}
        </aside>
      ) : null}
    </article>
  );
}

interface EntityDetailSectionProps {
  readonly section: EntityDetailSectionManifest;
  readonly values: Readonly<Record<string, unknown>>;
}

function EntityDetailSection({ section, values }: EntityDetailSectionProps): ReactNode {
  const { resolveLabel } = useEntityRenderer();

  return (
    <section data-granit-detail-section="" data-section-key={section.key}>
      {section.labelKey ? (
        <header data-granit-section-header="">{resolveLabel(section.labelKey)}</header>
      ) : null}
      {section.inheritsFromFormVariant ? (
        <div data-granit-detail-inherits="" data-form-variant={section.inheritsFromFormVariant}>
          {/* Inherits-from-form rendering lands in a follow-up story under #299. */}
        </div>
      ) : (
        <dl data-granit-detail-fields="">
          {(section.fields ?? []).map((property) => (
            <div key={property} data-granit-detail-row="" data-property={property}>
              <dt data-granit-detail-label="">{property}</dt>
              <dd data-granit-detail-value="">{formatValue(values[property])}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function EntityDetailSidePanelSlot({
  panel,
}: {
  readonly panel: EntityDetailSidePanelManifest;
}): ReactNode {
  return <div data-granit-side-panel-slot="" data-kind={panel.kind} data-order={panel.order} />;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? '✓' : '✗';
  return String(value);
}
