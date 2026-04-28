import type {
  AcceptAgreementRequest,
  AgreementHistoryEntry,
  AgreementStatus,
  LegalDocument,
  LegalDocumentCreateRequest,
  LegalDocumentDetail,
  LegalDocumentListParams,
  LegalDocumentUpdateRequest,
  PrivacyDeletionRequest,
  PrivacyDeletionResponse,
  PrivacyExportRequestResponse,
  PrivacyExportStatusResponse,
} from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

// ── Data Export (GDPR Art. 15/20) ────────────────────────────────────────────

/**
 * Request a GDPR data export. Returns 202 with the request ID.
 *
 * `POST {basePath}/exports`
 */
export async function requestExport(
  client: AxiosInstance,
  basePath: string
): Promise<PrivacyExportRequestResponse> {
  const { data } = await client.post<PrivacyExportRequestResponse>(`${basePath}/exports`);
  return data;
}

/**
 * Get the status of a data export request.
 *
 * `GET {basePath}/exports/{requestId}`
 */
export async function getExportStatus(
  client: AxiosInstance,
  basePath: string,
  requestId: string
): Promise<PrivacyExportStatusResponse> {
  const { data } = await client.get<PrivacyExportStatusResponse>(
    `${basePath}/exports/${encodeURIComponent(requestId)}`
  );
  return data;
}

/**
 * List all data export requests for the current user.
 *
 * `GET {basePath}/exports`
 */
export async function listExports(
  client: AxiosInstance,
  basePath: string
): Promise<PrivacyExportStatusResponse[]> {
  const { data } = await client.get<PrivacyExportStatusResponse[]>(`${basePath}/exports`);
  return data;
}

// ── Data Deletion (GDPR Art. 17) ─────────────────────────────────────────────

/**
 * Request deletion of all personal data.
 *
 * When `defer` is `true`, the deletion is scheduled after a cooling-off
 * period and can be cancelled via {@link cancelDeletion}.
 *
 * `POST {basePath}/deletions`
 */
export async function requestDeletion(
  client: AxiosInstance,
  basePath: string,
  request: PrivacyDeletionRequest
): Promise<PrivacyDeletionResponse> {
  const { data } = await client.post<PrivacyDeletionResponse>(`${basePath}/deletions`, request);
  return data;
}

/**
 * List all deletion requests for the current user.
 *
 * `GET {basePath}/deletions`
 */
export async function listDeletions(
  client: AxiosInstance,
  basePath: string
): Promise<PrivacyDeletionResponse[]> {
  const { data } = await client.get<PrivacyDeletionResponse[]>(`${basePath}/deletions`);
  return data;
}

/**
 * Get the status of a specific deletion request.
 *
 * `GET {basePath}/deletions/{requestId}`
 */
export async function getDeletionStatus(
  client: AxiosInstance,
  basePath: string,
  requestId: string
): Promise<PrivacyDeletionResponse> {
  const { data } = await client.get<PrivacyDeletionResponse>(
    `${basePath}/deletions/${encodeURIComponent(requestId)}`
  );
  return data;
}

/**
 * Cancel a deferred deletion request during the cooling-off period.
 *
 * Returns 409 if the request is already executed or already cancelled.
 *
 * `POST {basePath}/deletions/{requestId}/cancel`
 */
export async function cancelDeletion(
  client: AxiosInstance,
  basePath: string,
  requestId: string
): Promise<void> {
  await client.post(`${basePath}/deletions/${encodeURIComponent(requestId)}/cancel`);
}

// ── Legal Agreements (GDPR Art. 7) ───────────────────────────────────────────

/**
 * List all legal documents.
 *
 * `GET {basePath}/agreements/documents`
 */
export async function getAgreementDocuments(
  client: AxiosInstance,
  basePath: string
): Promise<LegalDocument[]> {
  const { data } = await client.get<LegalDocument[]>(`${basePath}/agreements/documents`);
  return data;
}

/**
 * Get the acceptance status for each legal document.
 *
 * `GET {basePath}/agreements/status`
 */
export async function getAgreementStatuses(
  client: AxiosInstance,
  basePath: string
): Promise<AgreementStatus[]> {
  const { data } = await client.get<AgreementStatus[]>(`${basePath}/agreements/status`);
  return data;
}

/**
 * Get the full acceptance history.
 *
 * `GET {basePath}/agreements/history`
 */
export async function getAgreementHistory(
  client: AxiosInstance,
  basePath: string
): Promise<AgreementHistoryEntry[]> {
  const { data } = await client.get<AgreementHistoryEntry[]>(`${basePath}/agreements/history`);
  return data;
}

/**
 * Accept a legal document version.
 *
 * `POST {basePath}/agreements/accept`
 *
 * Returns 201 on success, 404 if document unknown, 409 if already accepted,
 * 422 if version mismatch.
 */
export async function acceptAgreement(
  client: AxiosInstance,
  basePath: string,
  request: AcceptAgreementRequest
): Promise<void> {
  await client.post(`${basePath}/agreements/accept`, request);
}

// ── Legal Document Admin (lifecycle management) ─────────────────────────────

/**
 * Create a new legal document draft.
 *
 * `POST {basePath}/legal-documents`
 */
export async function createLegalDocument(
  client: AxiosInstance,
  basePath: string,
  request: LegalDocumentCreateRequest
): Promise<LegalDocumentDetail> {
  const { data } = await client.post<LegalDocumentDetail>(`${basePath}/legal-documents`, request);
  return data;
}

/**
 * Get a legal document version by ID (includes drafts and archived).
 *
 * `GET {basePath}/legal-documents/{id}`
 */
export async function getLegalDocument(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<LegalDocumentDetail> {
  const { data } = await client.get<LegalDocumentDetail>(
    `${basePath}/legal-documents/${encodeURIComponent(id)}`
  );
  return data;
}

/**
 * List legal document versions, optionally filtered by document ID.
 *
 * `GET {basePath}/legal-documents`
 */
export async function listLegalDocuments(
  client: AxiosInstance,
  basePath: string,
  params?: LegalDocumentListParams
): Promise<LegalDocumentDetail[]> {
  const { data } = await client.get<LegalDocumentDetail[]>(`${basePath}/legal-documents`, {
    params,
  });
  return data;
}

/**
 * Update a legal document draft.
 *
 * `PUT {basePath}/legal-documents/{id}`
 */
export async function updateLegalDocument(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: LegalDocumentUpdateRequest
): Promise<LegalDocumentDetail> {
  const { data } = await client.put<LegalDocumentDetail>(
    `${basePath}/legal-documents/${encodeURIComponent(id)}`,
    request
  );
  return data;
}

/**
 * Publish a legal document draft. Auto-archives the current published version
 * and triggers re-consent notifications.
 *
 * `POST {basePath}/legal-documents/{id}/publish`
 */
export async function publishLegalDocument(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<LegalDocumentDetail> {
  const { data } = await client.post<LegalDocumentDetail>(
    `${basePath}/legal-documents/${encodeURIComponent(id)}/publish`
  );
  return data;
}
