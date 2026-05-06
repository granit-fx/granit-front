/**
 * Customization permission keys (mirror `Granit.EntitiesCustomization`
 * permissions on the backend, ADR-053 §6).
 *
 *  - `Forms.Read` — observe the active form layout deltas
 *  - `Forms.Manage` — write/replace the form layout deltas
 *  - `Workspaces.Read` / `Workspaces.Manage` — same, for workspaces
 */
export const CustomizationPermissions = {
  EntitiesCustomization: {
    Forms: {
      Read: 'EntitiesCustomization.Forms.Read',
      Manage: 'EntitiesCustomization.Forms.Manage',
    },
    Workspaces: {
      Read: 'EntitiesCustomization.Workspaces.Read',
      Manage: 'EntitiesCustomization.Workspaces.Manage',
    },
  },
} as const;
