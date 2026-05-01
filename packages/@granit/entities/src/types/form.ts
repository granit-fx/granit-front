import type { VisibilityCondition } from './visibility.js';

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
}
