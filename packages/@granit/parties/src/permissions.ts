/**
 * Permission constants for the parties module.
 *
 * Mirrors `Granit.Parties.Endpoints.Permissions.PartiesPermissions`. Manage was
 * deliberately split into four narrower permissions for least-privilege (ISO 27001
 * A.5.15) — `Lifecycle`, `SetTaxStatus` and `ExternalMappings` each carry a higher
 * blast radius than routine identity edits and live behind their own audit path.
 */
export const PartiesPermissions = {
  Parties: {
    /** Read access (list / by-id). */
    Read: 'Parties.Parties.Read',
    /** Identity write (create / update display fields, addresses, emails, phones, roles, metadata, internal notes). */
    Manage: 'Parties.Parties.Manage',
    /** Lifecycle transitions (suspend / activate / archive). */
    Lifecycle: 'Parties.Parties.Lifecycle',
    /** Set or clear the customer-specific tax status (financial-impact). */
    SetTaxStatus: 'Parties.Parties.SetTaxStatus',
    /** Register or remove external provider mappings (Stripe / Mollie / Odoo / …). */
    ExternalMappings: 'Parties.Parties.ExternalMappings',
    /**
     * Merge two parties (preview + commit). Tombstones the loser, rewrites
     * foreign keys across modules (Invoicing, Subscriptions, Payments, …) and
     * is non-trivially reversible — gated behind its own permission so audit
     * and approval can be tightened independently.
     */
    Merge: 'Parties.Parties.Merge',
  },
} as const;
