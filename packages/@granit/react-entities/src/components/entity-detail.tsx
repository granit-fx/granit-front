import { evaluateVisibility } from '@granit/entities';
import { useMemo, type ReactNode } from 'react';

import { useEntityRelationAggregates } from '../api/use-entity-relation-aggregates.js';
import { useEntityRenderer } from '../provider/entity-renderer-provider.js';

import type {
  EntityDetailManifest,
  EntityDetailSectionManifest,
  EntityDetailSidePanelManifest,
  EntityFormFieldManifest,
  EntityFormManifest,
  EntityRelationManifest,
  RelationAggregateValue,
} from '@granit/entities';

export interface EntityDetailProps {
  /** Detail variant from the manifest (one of `manifest.details`). */
  readonly variant: EntityDetailManifest;
  /** Current entity values keyed by PascalCase property name. */
  readonly values: Readonly<Record<string, unknown>>;
  /**
   * Form variants from the manifest (`manifest.forms`). Required when any
   * detail section sets `inheritsFromFormVariant`; ignored otherwise.
   */
  readonly formVariants?: readonly EntityFormManifest[];
  /**
   * Wire identifier of the entity (e.g. `"Granit.Parties.Party"`,
   * available from `manifest.identity.name`). Required when the variant
   * declares side panels and the provider catalog has matching renderers.
   */
  readonly entityName?: string;
  /**
   * Id of the current entity instance. Required when the variant
   * declares side panels and the provider catalog has matching renderers.
   */
  readonly entityId?: string;
  /**
   * Relations declared on the entity (`manifest.relations`). When set
   * together with `entityName` + `entityId`, every relation with
   * `display === 'SmartButton'` renders in a header strip with its
   * batched aggregate count. Other display modes (Tab / Sidebar /
   * InlineChips) are emitted as placeholder slots; their renderers
   * land in a follow-up story.
   */
  readonly relations?: readonly EntityRelationManifest[];
  /**
   * Optional handler invoked when a smart-button relation is clicked.
   * Receives the relation manifest entry; the host typically navigates
   * to the related list scoped to the source row.
   */
  readonly onRelationClick?: (relation: EntityRelationManifest) => void;
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
 * Sections may inherit a form variant's structure via
 * `inheritsFromFormVariant` — the form's fields (across all its sections)
 * are flattened into the detail section in declaration order, with their
 * `labelKey` resolved via the provider and `visibleIf` evaluated against
 * the current values. The form's section grouping is dropped on purpose:
 * the detail section already provides one header, nesting two would
 * surprise readers.
 *
 * Values are displayed via `String(value)`, with `null` / `undefined`
 * collapsed to `'—'`. A read-mode widget catalog (currency / date / link
 * formatting) is a follow-up.
 */
export function EntityDetail({
  variant,
  values,
  formVariants,
  entityName,
  entityId,
  relations,
  onRelationClick,
  className,
}: EntityDetailProps): ReactNode {
  const sortedSections = useMemo(
    () => [...variant.sections].sort((a, b) => a.order - b.order),
    [variant.sections]
  );
  const sortedSidePanels = useMemo(
    () => [...variant.sidePanels].sort((a, b) => a.order - b.order),
    [variant.sidePanels]
  );
  const smartButtons = useMemo(
    () =>
      (relations ?? [])
        .filter((r) => r.display === 'SmartButton')
        .sort((a, b) => a.order - b.order),
    [relations]
  );

  return (
    <article data-granit-entity-detail="" data-variant={variant.name} className={className}>
      {smartButtons.length > 0 && entityName && entityId ? (
        <SmartButtonsStrip
          entityName={entityName}
          entityId={entityId}
          relations={smartButtons}
          onRelationClick={onRelationClick}
        />
      ) : null}
      <div data-granit-detail-sections="">
        {sortedSections.map((section) => (
          <EntityDetailSection
            key={section.key}
            section={section}
            values={values}
            formVariants={formVariants}
          />
        ))}
      </div>
      {sortedSidePanels.length > 0 ? (
        <aside data-granit-detail-rail="">
          {sortedSidePanels.map((panel) => (
            <EntityDetailSidePanelSlot
              key={panel.kind}
              panel={panel}
              entityName={entityName}
              entityId={entityId}
            />
          ))}
        </aside>
      ) : null}
    </article>
  );
}

interface EntityDetailSectionProps {
  readonly section: EntityDetailSectionManifest;
  readonly values: Readonly<Record<string, unknown>>;
  readonly formVariants: readonly EntityFormManifest[] | undefined;
}

function EntityDetailSection({
  section,
  values,
  formVariants,
}: EntityDetailSectionProps): ReactNode {
  const { resolveLabel } = useEntityRenderer();
  const inheritedFields = useMemo(
    () =>
      section.inheritsFromFormVariant
        ? resolveInheritedFields(section.inheritsFromFormVariant, formVariants)
        : null,
    [section.inheritsFromFormVariant, formVariants]
  );

  return (
    <section data-granit-detail-section="" data-section-key={section.key}>
      {section.labelKey ? (
        <header data-granit-section-header="">{resolveLabel(section.labelKey)}</header>
      ) : null}
      {section.inheritsFromFormVariant ? (
        inheritedFields ? (
          <dl data-granit-detail-fields="" data-inherits-from={section.inheritsFromFormVariant}>
            {inheritedFields.map((field) => (
              <InheritedFieldRow
                key={field.propertyName}
                field={field}
                values={values}
                resolveLabel={resolveLabel}
              />
            ))}
          </dl>
        ) : (
          <div
            data-granit-detail-inherits-missing=""
            data-form-variant={section.inheritsFromFormVariant}
          >
            {/* Form variant referenced by the section was not supplied via formVariants. */}
          </div>
        )
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

interface InheritedFieldRowProps {
  readonly field: EntityFormFieldManifest;
  readonly values: Readonly<Record<string, unknown>>;
  readonly resolveLabel: (key: string, fallback?: string) => string;
}

function InheritedFieldRow({ field, values, resolveLabel }: InheritedFieldRowProps): ReactNode {
  if (field.visibleIf && !evaluateVisibility(field.visibleIf, values)) {
    return null;
  }
  const label = field.labelKey ? resolveLabel(field.labelKey) : field.propertyName;
  return (
    <div data-granit-detail-row="" data-property={field.propertyName} data-inherited="">
      <dt data-granit-detail-label="">{label}</dt>
      <dd data-granit-detail-value="">{formatValue(values[field.propertyName])}</dd>
    </div>
  );
}

interface EntityDetailSidePanelSlotProps {
  readonly panel: EntityDetailSidePanelManifest;
  readonly entityName: string | undefined;
  readonly entityId: string | undefined;
}

function EntityDetailSidePanelSlot({
  panel,
  entityName,
  entityId,
}: EntityDetailSidePanelSlotProps): ReactNode {
  const { widgets } = useEntityRenderer();
  const Renderer = widgets.sidePanels?.[panel.kind];
  const canRender = Renderer && entityName && entityId;
  return (
    <div data-granit-side-panel-slot="" data-kind={panel.kind} data-order={panel.order}>
      {canRender ? <Renderer entityName={entityName} entityId={entityId} /> : null}
    </div>
  );
}

/**
 * Walks a form variant in declaration order (sections sorted by `order`,
 * fields sorted by `order` within each section) and returns the flat
 * field list. Returns `null` when the variant is unknown so the caller
 * can render a missing-variant marker.
 */
function resolveInheritedFields(
  variantName: string,
  formVariants: readonly EntityFormManifest[] | undefined
): readonly EntityFormFieldManifest[] | null {
  if (!formVariants) return null;
  const variant = formVariants.find((v) => v.name === variantName);
  if (!variant) return null;
  const sortedSections = [...variant.sections].sort((a, b) => a.order - b.order);
  const fields: EntityFormFieldManifest[] = [];
  for (const section of sortedSections) {
    const sortedFields = [...section.fields].sort((a, b) => a.order - b.order);
    fields.push(...sortedFields);
  }
  return fields;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? '✓' : '✗';
  return String(value);
}

interface SmartButtonsStripProps {
  readonly entityName: string;
  readonly entityId: string;
  readonly relations: readonly EntityRelationManifest[];
  readonly onRelationClick: ((relation: EntityRelationManifest) => void) | undefined;
}

function SmartButtonsStrip({
  entityName,
  entityId,
  relations,
  onRelationClick,
}: SmartButtonsStripProps): ReactNode {
  const relationNames = useMemo(() => relations.map((r) => r.name), [relations]);
  const aggregates = useEntityRelationAggregates(entityName, entityId, {
    relations: relationNames,
  });

  return (
    <nav data-granit-detail-smart-buttons="" aria-label="Related">
      {relations.map((relation) => (
        <SmartButton
          key={relation.name}
          relation={relation}
          value={aggregates.data?.aggregates[relation.name]}
          isLoading={aggregates.isLoading}
          onClick={onRelationClick}
        />
      ))}
    </nav>
  );
}

interface SmartButtonProps {
  readonly relation: EntityRelationManifest;
  readonly value: RelationAggregateValue | undefined;
  readonly isLoading: boolean;
  readonly onClick: ((relation: EntityRelationManifest) => void) | undefined;
}

function SmartButton({ relation, value, isLoading, onClick }: SmartButtonProps): ReactNode {
  const { resolveLabel } = useEntityRenderer();
  const label = relation.displayKey ? resolveLabel(relation.displayKey) : relation.name;
  const count = value?.count ?? null;

  return (
    <button
      type="button"
      data-granit-smart-button=""
      data-relation={relation.name}
      data-cardinality={relation.cardinality}
      onClick={onClick ? () => onClick(relation) : undefined}
      disabled={!onClick}
    >
      <span data-granit-smart-button-label="">{label}</span>
      <span data-granit-smart-button-count="">
        {isLoading ? '…' : count !== null ? String(count) : '—'}
      </span>
    </button>
  );
}
