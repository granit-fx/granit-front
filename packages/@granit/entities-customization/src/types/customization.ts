import type { LayoutDelta } from './delta';

/**
 * Layout kind — the surface of an entity layout being customized. Mirrors
 * `Granit.EntitiesCustomization.LayoutKind`.
 */
export type LayoutKind = 'FormDefault' | 'DetailDefault' | 'List' | 'Calendar' | 'Gallery';

/** Body for `PUT /entities/{name}/customization/{layoutKind}`. */
export interface EntityCustomizationRequest {
  readonly deltas: readonly LayoutDelta[];
}

/** Response from `GET|PUT /entities/{name}/customization/{layoutKind}`. */
export interface EntityCustomizationResponse {
  readonly id: string;
  readonly entityName: string;
  readonly layoutKind: LayoutKind;
  readonly deltas: readonly LayoutDelta[];
}

/** Body for `PUT /workspaces/{name}/customization`. */
export interface WorkspaceCustomizationRequest {
  readonly deltas: readonly LayoutDelta[];
}

/** Response from `GET|PUT /workspaces/{name}/customization`. */
export interface WorkspaceCustomizationResponse {
  readonly workspaceName: string;
  readonly deltas: readonly LayoutDelta[];
  readonly updatedAt: string | null;
  readonly updatedByUserId: string | null;
}
