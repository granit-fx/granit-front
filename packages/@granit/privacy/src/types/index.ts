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
export type DeletionStatusValue = DeletionState; // NOSONAR: deprecated alias kept for backwards compatibility

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

export type PrivacyLegalDocumentResponse = {
  readonly documentId: string;
  readonly currentVersion: string;
  readonly displayName: string;
};

export type PrivacyConsentStatusResponse = {
  readonly documentId: string;
  readonly currentVersion: string;
  readonly hasAcceptedLatest: boolean;
  readonly lastAcceptedAt: string | null;
};

export type PrivacyUserAgreementResponse = {
  readonly id: string;
  readonly documentId: string;
  readonly version: string;
  readonly acceptedAt: string;
  readonly isLatest: boolean;
};

export type PrivacyAcceptAgreementRequest = {
  readonly documentId: string;
  readonly version: string;
};

// ── Legal Document Admin (GDPR Art. 7 — document lifecycle) ─────────────────

export type LegalDocumentLifecycleStatus = 'Draft' | 'Published' | 'Archived';

export type LegalDocumentListParams = {
  readonly documentId?: string;
};

export type LegalDocumentDetailResponse = {
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

// ── Regulation Profile ────────────────────────────────────────────────────────

export type PrivacyRegulationProfileResponse = {
  readonly regulation: string;
  readonly displayName: string;
  readonly jurisdictionCode: string;
  readonly consentModel: string;
  readonly availableLegalBases: readonly string[];
  readonly subjectAccessRequestDays: number;
  readonly subjectAccessRequestExtensionDays: number | null;
  readonly deletionRequestDays: number | null;
  readonly defaultDeletionGracePeriodDays: number;
  readonly maxDeletionGracePeriodDays: number;
  readonly breachNotifyAuthorityHours: number | null;
  readonly breachNotifyIndividualsHours: number | null;
  readonly minimumConsentAge: number;
  readonly requiresParentalIdentityVerification: boolean;
  readonly cookieConsentModel: string;
  readonly honorGlobalPrivacyControl: boolean;
  readonly requiresCrossBorderAssessment: boolean;
  readonly transferMechanisms: readonly string[];
  readonly dataLocalizationRequired: boolean;
  readonly requiresDpoOrRepresentative: boolean;
  readonly requiredExportFormats: readonly string[];
};

// ── Processing Purposes ───────────────────────────────────────────────────────

export type PrivacyProcessingPurposeResponse = {
  readonly purposeId: string;
  readonly displayName: string;
  readonly description: string;
  readonly legalBasis: string;
  readonly requiresExplicitConsent: boolean;
  readonly dataCategory: string | null;
};

// ── Opt-Out (CCPA) ────────────────────────────────────────────────────────────

export type PrivacyOptOutStatusResponse = {
  readonly isOptedOut: boolean;
  readonly optedOutAt: string | null;
  readonly regulation: string | null;
};

// ── Export Scopes ─────────────────────────────────────────────────────────────

export type PrivacyExportScopeResponse = {
  readonly providerName: string;
  readonly displayKey: string;
  readonly featureName: string | null;
  readonly defaultSelected: boolean;
  readonly estimatedSizeBytes: number | null;
};

// ── Export Requests ───────────────────────────────────────────────────────────

export type PrivacyExportRequest = {
  readonly scopes?: readonly string[] | null;
};

export type PrivacyExportOnBehalfOfRequest = {
  readonly subjectUserId: string;
  readonly scopes?: readonly string[] | null;
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
