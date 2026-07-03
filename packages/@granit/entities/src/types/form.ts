import type { VisibilityCondition } from './visibility';
import type { LookupDescriptor } from '@granit/data-lookup';

/**
 * Identifies the manifest layer that contributed a field, and the optional
 * override record that introduced it. Mirrors
 * `Granit.Entities.Endpoints.Dtos.EntityProvenance`.
 */
export interface EntityProvenance {
  /** Layer identifier (e.g. `"base"`, `"tenant"`, `"user"`). */
  readonly layer: string;
  /** Id of the override record that introduced the field, or `null` for base-layer fields. */
  readonly overrideId: string | null;
}

/**
 * Describes an owned collection rendered inline within a form section.
 * Mirrors `Granit.Entities.Endpoints.Dtos.EntityFormOwnedCollectionManifest`.
 */
export interface EntityFormOwnedCollectionManifest {
  readonly propertyName: string;
  readonly itemTypeName: string;
  readonly itemFields: readonly string[];
  readonly itemDisplayProperty: string | null;
  readonly maxRendered: number | null;
}

/**
 * One form field. Mirrors
 * `Granit.Entities.Endpoints.Dtos.EntityFormFieldManifest`.
 */
export interface EntityFormFieldManifest {
  /** PascalCase property name on the entity. */
  readonly propertyName: string;
  /** Short CLR type name — drives the renderer when `component` doesn't override it. */
  readonly clrTypeName: string;
  /**
   * Component identifier — either from the standard catalog or the
   * `custom:` namespace (ADR-041). Mirrors the .NET
   * `FieldDescriptor.Component` (renamed from `Widget`).
   */
  readonly component: string;
  /** Opaque component-specific configuration. */
  readonly config: Readonly<Record<string, unknown>> | null;
  /** i18n key for the field label. */
  readonly labelKey: string | null;
  /** i18n key for the help text under the field. */
  readonly helpKey: string | null;
  /** Display order within the section (lower first). */
  readonly order: number;
  /** Read-only in the form context. */
  readonly readOnly: boolean;
  /** Closed-DSL conditional-visibility rule (ADR-040). */
  readonly visibleIf: VisibilityCondition | null;
  /**
   * Optional data-lookup source (ADR-028). When set, the form renders a
   * server-backed typeahead picker (`<LookupSelect>` via the `lookup` catalog
   * component) instead of a free-text / select control — the same source a
   * query column binds via `ColumnBuilder.Lookup`, so a foreign-key field
   * resolves consistently in the grid filter and the edit form. Mirrors the
   * .NET `FieldDescriptor.Lookup`; `null` for fields without a declared lookup.
   */
  readonly lookup: LookupDescriptor | null;
  /**
   * Provenance of the field declaration — identifies which manifest layer
   * and, if applicable, which override record introduced it. `null` for
   * base-layer fields without a tracked origin.
   */
  readonly provenance: EntityProvenance | null;
  /**
   * Optional semantic display-type (`Currency`, `Url`, `Email`, …) — the same
   * vocabulary a query column carries (`ColumnDefinition.valueKind`). Lets the
   * renderer upgrade the default edit input when {@link component} was left at
   * its CLR-type default; an explicit component always wins. Wire values are
   * the .NET `ValueKind` enum member names verbatim (PascalCase). `null` when
   * no hint is declared. Mirrors `FieldDescriptor.ValueKind`. Optional key so
   * the addition stays non-breaking for manifest consumers.
   */
  readonly valueKind?: string | null;
}

/**
 * One form section. Mirrors
 * `Granit.Entities.Endpoints.Dtos.EntityFormSectionManifest`.
 */
export interface EntityFormSectionManifest {
  /** Stable section key (e.g. `"identity"`). */
  readonly key: string;
  /** i18n key for the section header. */
  readonly labelKey: string | null;
  /** Display order (lower first). */
  readonly order: number;
  /** Whether the section starts collapsed. */
  readonly collapsedByDefault: boolean;
  /** Fields the user is allowed to see — already permission-filtered server-side. */
  readonly fields: readonly EntityFormFieldManifest[];
  /**
   * Optional inline owned-collection rendered in this section. `null` when
   * the section is a plain field group.
   */
  readonly ownedCollection: EntityFormOwnedCollectionManifest | null;
}

/**
 * One form variant exposed in the manifest. Mirrors
 * `Granit.Entities.Endpoints.Dtos.EntityFormManifest`.
 */
export interface EntityFormManifest {
  /** Variant name, unique per entity (e.g. `"default"`, `"quick"`, `"wizard"`). */
  readonly name: string;
  /** When `true`, tenant admins may reorder / regroup / hide fields (Tier B Layer 1). */
  readonly customizable: boolean;
  /** Sections in declaration order. */
  readonly sections: readonly EntityFormSectionManifest[];
  /**
   * Field names hidden by an active admin override (Layer 1). `null` when
   * no fields are overridden, or when the manifest was fetched without the
   * customization facet.
   */
  readonly hiddenByOverride: readonly string[] | null;
}
