/**
 * Closed enum of slot kinds the workspace tree exposes. Mirrors
 * `Granit.Workspaces.WorkspaceItemKind`.
 *
 * - `Entity` — reference to an `EntityDefinition`, the renderer mounts its list / kanban view
 * - `Dashboard` — reference to a `DashboardDefinition`
 * - `Link` — internal SPA route or external URL
 * - `SubWorkspace` — recurses into a child workspace
 * - `Feature` — reference to a feature declared in the host's feature catalog
 *   (ADR-057). The item carries a logical `routeName` resolved by the host's
 *   React route table at click time; the backend does not know URLs.
 */
export type WorkspaceItemKind = 'Entity' | 'Dashboard' | 'Link' | 'SubWorkspace' | 'Feature';

/**
 * One item in a workspace section. Mirrors
 * `Granit.Workspaces.Endpoints.Dtos.WorkspaceItemResponse`.
 *
 * Several fields are mutually exclusive depending on `kind` — `entityName`
 * is set for `Entity`, `dashboardName` for `Dashboard`, `featureName` +
 * `routeName` for `Feature`, etc. The wire format models this as a single
 * shape with optional fields rather than a discriminated union; consumers
 * should narrow on `kind` before reading the kind-specific fields.
 *
 * `entityPresetOverlay` carries the additive preset (filters, sort,
 * columns) layered on top of the entity's compiled defaults. Wire shape
 * is currently an opaque dictionary (`Readonly<Record<string, unknown>>`);
 * a typed schema is pending on the .NET side (cross-repo correction
 * filed against granit-fx/granit-dotnet#1554).
 */
export interface WorkspaceItemResponse {
  readonly kind: WorkspaceItemKind;
  readonly order: number;
  readonly displayKey: string | null;
  readonly icon: string | null;
  /** Set when `kind` is `Entity`. */
  readonly entityName: string | null;
  /** Optional preferred default `EntityView` name on the entity. */
  readonly entityViewName: string | null;
  /** Additive preset overlay (filters / sort / columns layered on the entity). */
  readonly entityPresetOverlay: Readonly<Record<string, unknown>> | null;
  /** Set when `kind` is `Dashboard`. */
  readonly dashboardName: string | null;
  /** Set when `kind` is `Link`. */
  readonly linkUrl: string | null;
  /** Set when `kind` is `SubWorkspace`. */
  readonly subWorkspaceName: string | null;
  /** Set when `kind` is `Feature` (ADR-057). */
  readonly featureName: string | null;
  /** Logical frontend route identifier (Feature items only) — resolved by the React route table at click time. */
  readonly routeName: string | null;
}

/**
 * One section within a workspace. Mirrors
 * `Granit.Workspaces.Endpoints.Dtos.WorkspaceSectionResponse`.
 */
export interface WorkspaceSectionResponse {
  readonly key: string;
  readonly displayKey: string | null;
  readonly order: number;
  readonly collapsedByDefault: boolean;
  readonly items: readonly WorkspaceItemResponse[];
}

/**
 * One workspace in the tree. Mirrors
 * `Granit.Workspaces.Endpoints.Dtos.WorkspaceResponse`.
 *
 * `isShell` distinguishes Framework shells (IdentityAccess / Platform /
 * Customization / Communication / Storage / Automation / Integrations /
 * Insights / AI / Observability / Compliance — populated by the
 * `Granit.Workspaces.Framework` contributions) from app-defined
 * workspaces; consumers can use it to render shells under a separate
 * "Framework" header in the sidebar.
 */
export interface WorkspaceResponse {
  readonly name: string;
  readonly displayKey: string | null;
  readonly icon: string | null;
  readonly order: number;
  readonly isShell: boolean;
  readonly sections: readonly WorkspaceSectionResponse[];
}

/**
 * Top-level payload returned by `GET /workspaces`. Mirrors
 * `Granit.Workspaces.Endpoints.Dtos.WorkspaceTreeResponse`.
 */
export interface WorkspaceTreeResponse {
  /** Workspace tree schema version (semver-major). Bumps on breaking shape changes. */
  readonly schemaVersion: number;
  /** Workspaces visible to the requesting user, sorted by `order` then `name`. */
  readonly workspaces: readonly WorkspaceResponse[];
}

/**
 * Schema version this package was compiled against. Consumers can check
 * `tree.schemaVersion === WORKSPACE_TREE_SCHEMA_VERSION` to assert the
 * wire shape matches what they were built for.
 *
 * The `Feature` kind + `featureName`/`routeName` fields (ADR-057) are an
 * additive change: the new fields are nullable, the new kind is a string
 * literal that older renderers can detect and skip. The schema version
 * therefore does NOT bump on this change.
 */
export const WORKSPACE_TREE_SCHEMA_VERSION = 1;
