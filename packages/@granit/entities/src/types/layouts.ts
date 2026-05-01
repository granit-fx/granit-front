import type { EntityFormFieldManifest } from './form.js';

/**
 * Closed enumeration of list-view layouts an entity may declare via the
 * manifest (per ADR-040). The renderer's `EntityListViewSwitcher` picks
 * the active layout from this list — single-layout entities skip the
 * switcher entirely.
 *
 * Mirrors `Granit.Entities.Layouts.EntityListLayoutKind`.
 */
export type EntityListLayoutKind = 'List' | 'Kanban' | 'Calendar';

/**
 * One alternative list-view layout exposed in the manifest. The kind drives
 * front-end component selection; per-kind config lives in `kanban` /
 * `calendar` (and future `map` / `gallery` slots). Exactly one of the
 * config slots is populated, matching `kind`.
 *
 * Mirrors `Granit.Entities.Endpoints.Dtos.EntityListLayoutManifest`.
 */
export interface EntityListLayoutManifest {
  /** Layout kind from the closed catalog. */
  readonly kind: EntityListLayoutKind;
  /** Whether this layout is the default tab on first render. */
  readonly isDefault: boolean;
  /** Kanban-specific configuration when `kind === 'Kanban'`, else `null`. */
  readonly kanban: EntityKanbanLayoutManifest | null;
  /** Calendar-specific configuration when `kind === 'Calendar'`, else `null`. */
  readonly calendar: EntityCalendarLayoutManifest | null;
}

/**
 * Calendar-specific layout configuration. Property names address fields on
 * the entity; the renderer reads the actual values via the range-query
 * endpoint (`GET /api/entities/{name}/calendar`).
 *
 * Mirrors `Granit.Entities.Endpoints.Dtos.EntityCalendarLayoutManifest`.
 */
export interface EntityCalendarLayoutManifest {
  /** Entity property carrying the event start (required). */
  readonly startPropertyName: string;
  /** Entity property carrying the event end. `null` for point-in-time markers. */
  readonly endPropertyName: string | null;
  /**
   * Entity property used as the event headline, or `null` to fall back to
   * the entity's `displayProperty`.
   */
  readonly titlePropertyName: string | null;
  /**
   * Entity property used to bucket events into colour groups, or `null`
   * for the theme default.
   */
  readonly colorByPropertyName: string | null;
}

/**
 * Kanban-specific layout configuration.
 *
 * Mirrors `Granit.Entities.Endpoints.Dtos.EntityKanbanLayoutManifest`.
 */
export interface EntityKanbanLayoutManifest {
  /** Entity property used to bucket rows into columns. */
  readonly groupByPropertyName: string;
  /** Short CLR type name of the group-by property — drives value parsing. */
  readonly groupByClrTypeName: string;
  /** Card-content schema for each tile. */
  readonly card: EntityKanbanCardManifest;
  /** Per-value column metadata (colour + default state). */
  readonly columns: readonly EntityKanbanColumnManifest[];
}

/**
 * Card-content schema rendered inside a kanban tile. Frappe-style: optional
 * title (falls back to the entity's `displayProperty`) plus an ordered list
 * of body fields, plus pinned smart-buttons (relations) and pinned
 * icon-buttons (actions).
 *
 * Mirrors `Granit.Entities.Endpoints.Dtos.EntityKanbanCardManifest`.
 */
export interface EntityKanbanCardManifest {
  /** Tile headline property, or `null` to fall back to `displayProperty`. */
  readonly titleProperty: string | null;
  /** Body fields, in declaration order — already permission-filtered. */
  readonly fields: readonly EntityFormFieldManifest[];
  /** Compact references to relations pinned on the tile. */
  readonly relations: readonly EntityKanbanCardRelationManifest[];
  /** Compact references to actions pinned on the tile. */
  readonly actions: readonly EntityKanbanCardActionManifest[];
}

/**
 * Compact reference to one relation pinned on a kanban tile. The full
 * relation descriptor stays addressable via the entity's `relations` facet
 * by `name`.
 *
 * Mirrors `Granit.Entities.Endpoints.Dtos.EntityKanbanCardRelationManifest`.
 */
export interface EntityKanbanCardRelationManifest {
  /** Stable relation name — matches the entry in `relations`. */
  readonly name: string;
  /** i18n key for the user-facing label. */
  readonly displayKey: string | null;
  /** Icon override for the smart-button. */
  readonly icon: string | null;
  /** Contributing assembly. `null` for intra-module declarations. */
  readonly contributorAssemblyName: string | null;
}

/**
 * Compact reference to one action pinned on a kanban tile. The full action
 * descriptor stays addressable via the entity's `actions` facet by `name`.
 *
 * Mirrors `Granit.Entities.Endpoints.Dtos.EntityKanbanCardActionManifest`.
 */
export interface EntityKanbanCardActionManifest {
  /** Stable action name — matches the entry in `actions`. */
  readonly name: string;
  /** i18n key for the user-facing label (rendered as tooltip). */
  readonly displayKey: string | null;
  /** Icon name from the catalog. */
  readonly icon: string | null;
  /** Contributing assembly. `null` for intra-module declarations. */
  readonly contributorAssemblyName: string | null;
}

/**
 * Closed catalog of column colours for the kanban layout. Each value maps
 * to a design-token in the renderer's theme; the wire never carries a hex
 * code, so tenant theming and dark-mode swaps stay declarative.
 *
 * Mirrors `Granit.Entities.Layouts.KanbanColor`.
 */
export type KanbanColor =
  | 'Neutral'
  | 'Gray'
  | 'Blue'
  | 'Green'
  | 'Orange'
  | 'Red'
  | 'Yellow'
  | 'Purple'
  | 'Cyan';

/**
 * Default render state of a kanban column. The framework declares the
 * value; per-user overlays (saved `EntityView`) may override it.
 *
 * Mirrors `Granit.Entities.Layouts.KanbanColumnState`.
 */
export type KanbanColumnState = 'Open' | 'Collapsed' | 'Hidden';

/**
 * One per-value kanban column declaration.
 *
 * Mirrors `Granit.Entities.Endpoints.Dtos.EntityKanbanColumnManifest`.
 */
export interface EntityKanbanColumnManifest {
  /** Wire form of the discrete `groupBy` value (enum member name, literal). */
  readonly value: string;
  /** Optional column colour from the closed catalog, or `null` for theme default. */
  readonly color: KanbanColor | null;
  /** Open / Collapsed / Hidden — initial render state per ADR-040. */
  readonly defaultState: KanbanColumnState;
}
