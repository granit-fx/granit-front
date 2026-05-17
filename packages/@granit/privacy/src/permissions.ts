/** Permission constants for the privacy module. Mirrors `Granit.Privacy.Endpoints.Permissions.PrivacyPermissions`. */
export const PrivacyPermissions = {
  /** Permissions for personal data export (GDPR Art. 15/20). */
  Export: {
    /** Request a personal data export. */
    Execute: 'Privacy.Export.Execute',
  },
  /** Permissions for personal data deletion (GDPR Art. 17). */
  Deletion: {
    /** Request and cancel personal data erasure. */
    Execute: 'Privacy.Deletion.Execute',
  },
  /** Permissions for processing purpose management. */
  Purposes: {
    /** Read registered processing purposes. */
    Read: 'Privacy.Purposes.Read',
  },
  /** Permissions for legal agreement consent management (GDPR Art. 7). */
  Agreements: {
    /** View legal documents and consent status. */
    Read: 'Privacy.Agreements.Read',
    /** Accept a legal agreement. */
    Create: 'Privacy.Agreements.Create',
  },
  /** Permissions for legal document version management (admin). */
  LegalDocuments: {
    /** View legal document versions and history. */
    Read: 'Privacy.LegalDocuments.Read',
    /** Create new legal document drafts. */
    Create: 'Privacy.LegalDocuments.Create',
    /** Edit, publish, and archive legal documents. */
    Manage: 'Privacy.LegalDocuments.Manage',
  },
} as const;
