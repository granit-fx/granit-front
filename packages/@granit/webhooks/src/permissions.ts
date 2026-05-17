/** Permission constants for the webhooks module. Mirrors `Granit.Webhooks.Endpoints.Permissions.WebhooksPermissions`. */
export const WebhooksPermissions = {
  /** Permissions for the webhook subscriptions resource. */
  Subscriptions: {
    /** Grants read-only access to view webhook subscriptions. */
    Read: 'Webhooks.Subscriptions.Read',
    /** Grants management access to webhook subscriptions (create, update, delete). */
    Manage: 'Webhooks.Subscriptions.Manage',
  },
} as const;
