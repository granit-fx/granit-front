import type { LayoutDelta } from './delta';

/**
 * Form variant — closed catalog mirroring `Granit.EntitiesCustomization.FormVariant`.
 * Customization scopes layouts per variant so the same entity can have different
 * field arrangements on the create form, the edit form, and the read view.
 */
export type FormVariant = 'Create' | 'Edit' | 'Read';

/** Body for `PUT /api/entities/{name}/customization/forms/{variant}`. */
export interface FormCustomizationRequest {
  readonly deltas: readonly LayoutDelta[];
}

/** Response from `GET|PUT /api/entities/{name}/customization/forms/{variant}`. */
export interface FormCustomizationResponse {
  readonly entityName: string;
  readonly variant: FormVariant;
  readonly deltas: readonly LayoutDelta[];
  readonly updatedAt: string | null;
  readonly updatedByUserId: string | null;
}

/** Body for `PUT /api/workspaces/{name}/customization`. */
export interface WorkspaceCustomizationRequest {
  readonly deltas: readonly LayoutDelta[];
}

/** Response from `GET|PUT /api/workspaces/{name}/customization`. */
export interface WorkspaceCustomizationResponse {
  readonly workspaceName: string;
  readonly deltas: readonly LayoutDelta[];
  readonly updatedAt: string | null;
  readonly updatedByUserId: string | null;
}
