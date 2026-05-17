/** Permission constants for the templating module. Mirrors `Granit.Templating.Endpoints.Permissions.TemplatingPermissions`. */
export const TemplatingPermissions = {
  /** Permissions for the templates resource. */
  Templates: {
    /** Grants read-only access to view templates (list, detail, history, variables, lifecycle). */
    Read: 'Templating.Templates.Read',
    /** Grants management access to template administration endpoints (save draft, delete draft, publish, unpublish). */
    Manage: 'Templating.Templates.Manage',
  },
  /** Permissions for the template categories resource. */
  Categories: {
    /** Grants read-only access to list template categories. */
    Read: 'Templating.Categories.Read',
    /** Grants management access to create, update, and delete template categories. */
    Manage: 'Templating.Categories.Manage',
  },
} as const;
