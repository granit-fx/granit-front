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

export type DeletionStatusValue = 'Deferred' | 'Executed' | 'Cancelled';

export type PrivacyDeletionRequest = {
  readonly reason: string;
  readonly defer?: boolean;
};

export type PrivacyDeletionResponse = {
  readonly requestId: string;
  readonly status: DeletionStatusValue;
  readonly reason: string;
  readonly requestedAt: string;
  readonly executedAt: string | null;
  readonly scheduledDeletionAt?: string;
  readonly cancelledAt?: string;
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
