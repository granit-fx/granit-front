import { evaluateVisibility } from '@granit/entities';
import { useMemo, type ReactNode } from 'react';

import { useEntityRelationAggregates } from '../hooks/use-entity-relation-aggregates.js';
import { useEntityRenderer } from '../providers/entity-renderer-provider.js';

import type {
  EntityDetailManifest,
  EntityDetailSectionManifest,
  EntityDetailSidePanelManifest,
  EntityFormFieldManifest,
  EntityFormManifest,
  EntityRelationManifest,
  RelationAggregateValue,
  RelationAggregatesResponse,
  RelationDisplay,
} from '@granit/entities';
import type { UseQueryResult } from '@tanstack/react-query';

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
   * together with `entityName` + `entityId`, every relation surfaces in
   * the layout slot matching its `display` mode:
   *
   * - `Tab` — full-width tab strip at the very top of the article
   * - `SmartButton` — header strip above the section column
   * - `InlineChips` — chip strip below the section column
   * - `Sidebar` — vertical group at the top of the right rail
   *
   * The framework only paints the navigation surface — clicking a Tab
   * fires `onRelationClick` like any other display mode. Apps own the
   * decision to swap the section column for a related list (typically
   * by routing to `/w/{workspace}/{relatedEntity}?source={sourceId}`)
   * or to render a side-peek; the framework deliberately stays
   * router-agnostic.
   */
  readonly relations?: readonly EntityRelationManifest[];
  /**
   * Optional handler invoked when a relation is clicked. Receives the
   * relation manifest entry; the host typically navigates to the
   * related list scoped to the source row.
   */
  readonly onRelationClick?: (relation: EntityRelationManifest) => void;
  /**
   * Maps free-form section property names (`section.fields: string[]`)
   * to detail-component ids registered on the provider. Lets apps
   * render `Website` as a clickable URL or `Phone` as a `tel:` link
   * without switching the section to `inheritsFromFormVariant`.
   * Inherited-mode sections take their component id from
   * `field.component` and ignore this map.
   *
   * Component ids belong to the same ADR-041 catalog as
   * `EntityFormFieldManifest.component` — there is **no separate
   * "format" concept** on the wire. `component: 'money'` +
   * `config: { currencyCode }` covers what other libraries call
   * `format: 'currency'`; the framework dispatches via the component
   * id in both edit (`<EntityForm />`) and read (`<EntityDetail />`)
   * contexts.
   *
   * When `formVariants` is supplied, `<EntityDetail />` auto-derives a
   * `(propertyName → component)` map from the form variants' fields
   * and uses it as the fallback. The explicit `propertyComponents`
   * prop, when provided, is **merged on top** of the auto-derived map
   * per key — apps override only the entries they care about.
   *
   * @example
   * ```tsx
   * <EntityDetail propertyComponents={{ Website: 'url', Email: 'email' }} />
   * ```
   */
  readonly propertyComponents?: Readonly<Record<string, string>>;
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
 * collapsed to `'—'`. A read-mode component catalog (currency / date / link
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
  propertyComponents,
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
  const resolvedPropertyComponents = useMemo(
    () => composePropertyComponents(formVariants, propertyComponents),
    [formVariants, propertyComponents]
  );
  const groupedRelations = useMemo(() => groupRelationsByDisplay(relations ?? []), [relations]);
  const allDisplayedNames = useMemo(
    () =>
      [
        ...groupedRelations.Tab,
        ...groupedRelations.SmartButton,
        ...groupedRelations.InlineChips,
        ...groupedRelations.Sidebar,
      ].map((r) => r.name),
    [groupedRelations]
  );

  // Single batched fetch covers every display mode.
  const aggregatesQuery = useEntityRelationAggregates(entityName ?? '', entityId ?? '', {
    relations: allDisplayedNames,
    enabled: Boolean(entityName) && Boolean(entityId) && allDisplayedNames.length > 0,
  });

  const renderable = Boolean(entityName) && Boolean(entityId);
  const showTabs = renderable && groupedRelations.Tab.length > 0;
  const showSmartButtons = renderable && groupedRelations.SmartButton.length > 0;
  const showInlineChips = renderable && groupedRelations.InlineChips.length > 0;
  const showSidebars = renderable && groupedRelations.Sidebar.length > 0;
  const showRail = showSidebars || sortedSidePanels.length > 0;

  return (
    <article data-granit-entity-detail="" data-variant={variant.name} className={className}>
      {showTabs ? (
        <RelationGroup
          display="Tab"
          relations={groupedRelations.Tab}
          aggregates={aggregatesQuery}
          onRelationClick={onRelationClick}
        />
      ) : null}
      {showSmartButtons ? (
        <RelationGroup
          display="SmartButton"
          relations={groupedRelations.SmartButton}
          aggregates={aggregatesQuery}
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
            propertyComponents={resolvedPropertyComponents}
          />
        ))}
      </div>
      {showInlineChips ? (
        <RelationGroup
          display="InlineChips"
          relations={groupedRelations.InlineChips}
          aggregates={aggregatesQuery}
          onRelationClick={onRelationClick}
        />
      ) : null}
      {showRail ? (
        <aside data-granit-detail-rail="">
          {showSidebars ? (
            <RelationGroup
              display="Sidebar"
              relations={groupedRelations.Sidebar}
              aggregates={aggregatesQuery}
              onRelationClick={onRelationClick}
            />
          ) : null}
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
  readonly propertyComponents: Readonly<Record<string, string>> | undefined;
}

function EntityDetailSection({
  section,
  values,
  formVariants,
  propertyComponents,
}: EntityDetailSectionProps): ReactNode {
  const { resolveLabel } = useEntityRenderer();
  const inheritedFields = useMemo(
    () =>
      section.inheritsFromFormVariant
        ? resolveInheritedFields(section.inheritsFromFormVariant, formVariants)
        : null,
    [section.inheritsFromFormVariant, formVariants]
  );

  let body: ReactNode;
  if (section.inheritsFromFormVariant) {
    body = inheritedFields ? (
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
      />
    );
  } else {
    body = (
      <dl data-granit-detail-fields="">
        {(section.fields ?? []).map((property) => (
          <FreeFormFieldRow
            key={property}
            property={property}
            value={values[property]}
            componentId={propertyComponents?.[property]}
          />
        ))}
      </dl>
    );
  }

  return (
    <section data-granit-detail-section="" data-section-key={section.key}>
      {section.labelKey ? (
        <header data-granit-section-header="">{resolveLabel(section.labelKey)}</header>
      ) : null}
      {body}
    </section>
  );
}

interface InheritedFieldRowProps {
  readonly field: EntityFormFieldManifest;
  readonly values: Readonly<Record<string, unknown>>;
  readonly resolveLabel: (key: string, fallback?: string) => string;
}

function InheritedFieldRow({ field, values, resolveLabel }: InheritedFieldRowProps): ReactNode {
  const { components } = useEntityRenderer();
  if (field.visibleIf && !evaluateVisibility(field.visibleIf, values)) {
    return null;
  }
  const label = field.labelKey ? resolveLabel(field.labelKey) : field.propertyName;
  const value = values[field.propertyName];
  const Component = components.detail?.[field.component];
  return (
    <div data-granit-detail-row="" data-property={field.propertyName} data-inherited="">
      <dt data-granit-detail-label="">{label}</dt>
      <dd data-granit-detail-value="">
        {Component ? (
          <Component propertyName={field.propertyName} value={value} field={field} />
        ) : (
          formatValue(value)
        )}
      </dd>
    </div>
  );
}

interface FreeFormFieldRowProps {
  readonly property: string;
  readonly value: unknown;
  readonly componentId: string | undefined;
}

function FreeFormFieldRow({ property, value, componentId }: FreeFormFieldRowProps): ReactNode {
  const { components } = useEntityRenderer();
  const Component = componentId ? components.detail?.[componentId] : undefined;
  return (
    <div data-granit-detail-row="" data-property={property}>
      <dt data-granit-detail-label="">{property}</dt>
      <dd data-granit-detail-value="">
        {Component ? <Component propertyName={property} value={value} /> : formatValue(value)}
      </dd>
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
  const { components } = useEntityRenderer();
  const Renderer = components.sidePanels?.[panel.kind];
  const canRender = Renderer && entityName && entityId;
  return (
    <div data-granit-side-panel-slot="" data-kind={panel.kind} data-order={panel.order}>
      {canRender ? <Renderer entityName={entityName} entityId={entityId} /> : null}
    </div>
  );
}

/**
 * Auto-derives a `(propertyName → component)` map from the supplied form
 * variants and merges any explicit `propertyComponents` override on top.
 *
 * - Walks every form variant + every section + every field, recording
 *   `field.component` keyed by `field.propertyName`. Last form wins on
 *   conflicts (subsequent variants tend to be more specialised).
 * - The explicit override map merges per-key so apps can correct
 *   individual entries without rebuilding the whole map.
 *
 * Returns `undefined` (not an empty object) when neither input yields
 * any mapping, so the renderer can keep its "no propertyComponents"
 * code path simple.
 */
function composePropertyComponents(
  formVariants: readonly EntityFormManifest[] | undefined,
  override: Readonly<Record<string, string>> | undefined
): Readonly<Record<string, string>> | undefined {
  const derived: Record<string, string> = {};
  for (const variant of formVariants ?? []) {
    for (const section of variant.sections) {
      for (const field of section.fields) {
        if (field.component) {
          derived[field.propertyName] = field.component;
        }
      }
    }
  }
  if (override) {
    for (const [key, component] of Object.entries(override)) {
      derived[key] = component;
    }
  }
  return Object.keys(derived).length > 0 ? derived : undefined;
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
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

interface RelationGroupProps {
  readonly display: RelationDisplay;
  readonly relations: readonly EntityRelationManifest[];
  readonly aggregates: UseQueryResult<RelationAggregatesResponse>;
  readonly onRelationClick: ((relation: EntityRelationManifest) => void) | undefined;
}

const GROUP_DATA_ATTRIBUTE: Record<RelationDisplay, string> = {
  Tab: 'data-granit-detail-tabs',
  SmartButton: 'data-granit-detail-smart-buttons',
  InlineChips: 'data-granit-detail-inline-chips',
  Sidebar: 'data-granit-detail-relation-sidebar',
};

const GROUP_ARIA_LABEL: Record<RelationDisplay, string> = {
  Tab: 'Related (tabs)',
  SmartButton: 'Related',
  InlineChips: 'Related (chips)',
  Sidebar: 'Related (sidebar)',
};

function RelationGroup({
  display,
  relations,
  aggregates,
  onRelationClick,
}: RelationGroupProps): ReactNode {
  return (
    <nav
      {...{ [GROUP_DATA_ATTRIBUTE[display]]: '' }}
      data-display={display}
      aria-label={GROUP_ARIA_LABEL[display]}
    >
      {relations.map((relation) => (
        <RelationItem
          key={relation.name}
          display={display}
          relation={relation}
          value={aggregates.data?.aggregates[relation.name]}
          isLoading={aggregates.isLoading}
          onClick={onRelationClick}
        />
      ))}
    </nav>
  );
}

interface RelationItemProps {
  readonly display: RelationDisplay;
  readonly relation: EntityRelationManifest;
  readonly value: RelationAggregateValue | undefined;
  readonly isLoading: boolean;
  readonly onClick: ((relation: EntityRelationManifest) => void) | undefined;
}

function RelationItem({
  display,
  relation,
  value,
  isLoading,
  onClick,
}: RelationItemProps): ReactNode {
  const { resolveLabel } = useEntityRenderer();
  const label = relation.displayKey ? resolveLabel(relation.displayKey) : relation.name;
  const count = value?.count ?? null;
  const countLabel = isLoading ? '…' : (count?.toString() ?? '—');

  return (
    <button
      type="button"
      data-granit-relation-item=""
      data-display={display}
      data-relation={relation.name}
      data-cardinality={relation.cardinality}
      // SmartButton retains its legacy data attribute so existing styles + tests stay valid.
      {...(display === 'SmartButton' ? { 'data-granit-smart-button': '' } : {})}
      onClick={onClick ? () => onClick(relation) : undefined}
      disabled={!onClick}
    >
      <span data-granit-relation-item-label="">{label}</span>
      <span data-granit-relation-item-count="">{countLabel}</span>
    </button>
  );
}

interface GroupedRelations {
  readonly SmartButton: readonly EntityRelationManifest[];
  readonly InlineChips: readonly EntityRelationManifest[];
  readonly Sidebar: readonly EntityRelationManifest[];
  readonly Tab: readonly EntityRelationManifest[];
}

function groupRelationsByDisplay(relations: readonly EntityRelationManifest[]): GroupedRelations {
  const grouped: { [K in RelationDisplay]: EntityRelationManifest[] } = {
    SmartButton: [],
    InlineChips: [],
    Sidebar: [],
    Tab: [],
  };
  for (const relation of relations) {
    grouped[relation.display].push(relation);
  }
  for (const key of Object.keys(grouped) as RelationDisplay[]) {
    grouped[key].sort((a, b) => a.order - b.order);
  }
  return grouped;
}
