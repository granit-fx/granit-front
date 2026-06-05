// ── Data Export (GDPR Art. 15/20) ────────────────────────────────────────────

export type PrivacyExportStatus = 'Pending' | 'Completed' | 'PartiallyCompleted' | 'TimedOut';

export type PrivacyExportRequestResponse = {
  readonly requestId: string;
  readonly requestedAt: string;
};

export type PrivacyExportStatusResponse = {
  readonly requestId: string;
  readonly requestedAt: string;
  readonly state: PrivacyExportStatus;
  readonly archiveBlobReferenceId: string | null;
  readonly completedAt: string | null;
  readonly missingProviders: readonly string[];
};

// ── Data Deletion (GDPR Art. 17) ─────────────────────────────────────────────

export type DeletionState = 'Deferred' | 'Executed' | 'Cancelled';

/** @deprecated Use DeletionState */
export type DeletionStatusValue = DeletionState;

export type PrivacyDeletionRequest = {
  readonly reason: string;
  readonly defer?: boolean;
};

/** Response from POST /privacy/deletions (202 Accepted). */
export type PrivacyDeletionRequestResponse = {
  readonly requestId: string;
  readonly scheduledDeletionAt: string;
};

/** Shape of each entry from GET /privacy/deletions and GET /privacy/deletions/{id}. */
export type PrivacyDeletionStatusResponse = {
  readonly requestId: string;
  readonly state: DeletionState;
  readonly reason: string;
  readonly requestedAt: string;
  readonly scheduledDeletionAt: string;
  readonly cancelledAt: string | null;
  readonly executedAt: string | null;
};

// ── Legal Agreements (GDPR Art. 7) ───────────────────────────────────────────

export type LegalDocument = {
  readonly documentId: string;
  readonly currentVersion: string;
  readonly displayName: string;
};

export type AgreementStatus = {
  readonly documentId: string;
  readonly currentVersion: string;
  readonly hasAcceptedLatest: boolean;
  readonly lastAcceptedAt: string | null;
};

export type AgreementHistoryEntry = {
  readonly id: string;
  readonly documentId: string;
  readonly version: string;
  readonly acceptedAt: string;
  readonly isLatest: boolean;
};

export type AcceptAgreementRequest = {
  readonly documentId: string;
  readonly version: string;
};

// ── Legal Document Admin (GDPR Art. 7 — document lifecycle) ─────────────────

export type LegalDocumentLifecycleStatus = 'Draft' | 'Published' | 'Archived';

export type LegalDocumentListParams = {
  readonly documentId?: string;
};

export type LegalDocumentDetail = {
  readonly id: string;
  readonly documentId: string;
  readonly version: number;
  readonly lifecycleStatus: LegalDocumentLifecycleStatus;
  readonly displayName: string;
  readonly description: string | null;
  readonly templateName: string | null;
  readonly documentBlobId: string | null;
  readonly createdAt: string;
  readonly lastModifiedAt: string;
  readonly concurrencyStamp: string;
};

export type LegalDocumentCreateRequest = {
  readonly documentId: string;
  readonly displayName: string;
  readonly description?: string;
  readonly templateName?: string;
};

export type LegalDocumentUpdateRequest = {
  readonly displayName: string;
  readonly concurrencyStamp: string;
  readonly description?: string;
  readonly templateName?: string;
  readonly documentBlobId?: string;
};
