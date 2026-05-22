/**
 * Permission constants for the presence module.
 * Mirrors `Granit.Presence.Endpoints.Permissions.PresencePermissions`.
 */
export const PresencePermissions = {
  /** Permissions controlling the current user's own presence. */
  Self: {
    /**
     * Grants the right to set/clear manual override and send heartbeats
     * for the current user's own presence.
     */
    Manage: 'Presence.Self.Manage',
  },
  /** Permissions controlling read access to other users' presence. */
  Users: {
    /** Grants read access to other users' presence (single + batch lookup). */
    Read: 'Presence.Users.Read',
  },
} as const;
