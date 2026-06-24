import type { PagedResult } from '@granit/query-engine';

import type {
  LegalDocumentCreateRequest,
  LegalDocumentDetailResponse,
  LegalDocumentListParams,
  LegalDocumentUpdateRequest,
  PrivacyAcceptAgreementRequest,
  PrivacyConsentStatusResponse,
  PrivacyDeletionRequest,
  PrivacyDeletionRequestResponse,
  PrivacyDeletionStatusResponse,
  PrivacyExportOnBehalfOfRequest,
  PrivacyExportRequest,
  PrivacyExportRequestResponse,
  PrivacyExportScopeResponse,
  PrivacyExportStatusResponse,
  PrivacyLegalDocumentResponse,
  PrivacyOptOutStatusResponse,
  PrivacyProcessingPurposeResponse,
  PrivacyRegulationProfileResponse,
  PrivacyUserAgreementResponse,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

// ── Data Export (GDPR Art. 15/20) ────────────────────────────────────────────

/**
 * Request a GDPR data export. Returns 202 with the request ID.
 *
 * `POST {basePath}/exports`
 */
export async function requestExport(
  client: AxiosInstance,
  basePath: string,
  request?: PrivacyExportRequest
): Promise<PrivacyExportRequestResponse> {
  const { data } = await client.post<PrivacyExportRequestResponse>(`${basePath}/exports`, request);
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
): Promise<PrivacyDeletionRequestResponse> {
  const { data } = await client.post<PrivacyDeletionRequestResponse>(
    `${basePath}/deletions`,
    request
  );
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
): Promise<PrivacyDeletionStatusResponse[]> {
  const { data } = await client.get<PrivacyDeletionStatusResponse[]>(`${basePath}/deletions`);
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
): Promise<PrivacyDeletionStatusResponse> {
  const { data } = await client.get<PrivacyDeletionStatusResponse>(
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
export async function listAgreementDocuments(
  client: AxiosInstance,
  basePath: string
): Promise<PrivacyLegalDocumentResponse[]> {
  const { data } = await client.get<PrivacyLegalDocumentResponse[]>(
    `${basePath}/agreements/documents`
  );
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
): Promise<PrivacyConsentStatusResponse[]> {
  const { data } = await client.get<PrivacyConsentStatusResponse[]>(
    `${basePath}/agreements/status`
  );
  return data;
}

/**
 * List the full acceptance history.
 *
 * `GET {basePath}/agreements/history`
 */
export async function listAgreementHistory(
  client: AxiosInstance,
  basePath: string
): Promise<PrivacyUserAgreementResponse[]> {
  const { data } = await client.get<PrivacyUserAgreementResponse[]>(
    `${basePath}/agreements/history`
  );
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
  request: PrivacyAcceptAgreementRequest
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
): Promise<LegalDocumentDetailResponse> {
  const { data } = await client.post<LegalDocumentDetailResponse>(
    `${basePath}/legal-documents`,
    request
  );
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
): Promise<LegalDocumentDetailResponse> {
  const { data } = await client.get<LegalDocumentDetailResponse>(
    `${basePath}/legal-documents/${encodeURIComponent(id)}`
  );
  return data;
}

/**
 * List legal document versions via the query engine. Optionally filter by document ID.
 *
 * `GET {basePath}/legal-documents`
 */
export async function listLegalDocuments(
  client: AxiosInstance,
  basePath: string,
  params?: LegalDocumentListParams
): Promise<PagedResult<LegalDocumentDetailResponse>> {
  const queryParams: Record<string, string> = {};
  if (params?.documentId) {
    queryParams['filter[documentId.eq]'] = params.documentId;
  }
  const { data } = await client.get<PagedResult<LegalDocumentDetailResponse>>(
    `${basePath}/legal-documents`,
    { params: Object.keys(queryParams).length > 0 ? queryParams : undefined }
  );
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
): Promise<LegalDocumentDetailResponse> {
  const { data } = await client.put<LegalDocumentDetailResponse>(
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
): Promise<LegalDocumentDetailResponse> {
  const { data } = await client.post<LegalDocumentDetailResponse>(
    `${basePath}/legal-documents/${encodeURIComponent(id)}/publish`
  );
  return data;
}

// ── Regulation Profile ────────────────────────────────────────────────────────

/**
 * Returns the privacy regulation profile applicable to the current tenant.
 *
 * `GET {basePath}/regulation`
 */
export async function getApplicableRegulation(
  client: AxiosInstance,
  basePath: string
): Promise<PrivacyRegulationProfileResponse> {
  const { data } = await client.get<PrivacyRegulationProfileResponse>(`${basePath}/regulation`);
  return data;
}

// ── Processing Purposes ───────────────────────────────────────────────────────

/**
 * Lists all processing purposes for the current tenant.
 *
 * `GET {basePath}/purposes`
 */
export async function listProcessingPurposes(
  client: AxiosInstance,
  basePath: string
): Promise<PrivacyProcessingPurposeResponse[]> {
  const { data } = await client.get<PrivacyProcessingPurposeResponse[]>(`${basePath}/purposes`);
  return data;
}

// ── Opt-Out (CCPA) ────────────────────────────────────────────────────────────

/**
 * Opts out of data sale/sharing (CCPA — Do Not Sell or Share).
 *
 * Supports both authenticated users and anonymous visitors.
 *
 * `POST {basePath}/opt-out`
 */
export async function requestOptOut(
  client: AxiosInstance,
  basePath: string
): Promise<PrivacyOptOutStatusResponse> {
  const { data } = await client.post<PrivacyOptOutStatusResponse>(`${basePath}/opt-out`);
  return data;
}

/**
 * Returns the current opt-out status for the requesting user or visitor.
 *
 * `GET {basePath}/opt-out/status`
 */
export async function getOptOutStatus(
  client: AxiosInstance,
  basePath: string
): Promise<PrivacyOptOutStatusResponse> {
  const { data } = await client.get<PrivacyOptOutStatusResponse>(`${basePath}/opt-out/status`);
  return data;
}

// ── Export Scopes ─────────────────────────────────────────────────────────────

/**
 * Lists available export scopes for the current tenant.
 *
 * `GET {basePath}/exports/scopes`
 */
export async function listExportScopes(
  client: AxiosInstance,
  basePath: string
): Promise<PrivacyExportScopeResponse[]> {
  const { data } = await client.get<PrivacyExportScopeResponse[]>(`${basePath}/exports/scopes`);
  return data;
}

// ── Export On Behalf Of (admin DSR) ──────────────────────────────────────────

/**
 * Requests a personal data export on behalf of another data subject (admin DSR).
 *
 * Requires the `Privacy.Exports.ExecuteOnBehalfOf` permission.
 *
 * `POST {basePath}/exports/on-behalf-of`
 */
export async function requestExportOnBehalfOf(
  client: AxiosInstance,
  basePath: string,
  request: PrivacyExportOnBehalfOfRequest
): Promise<PrivacyExportRequestResponse> {
  const { data } = await client.post<PrivacyExportRequestResponse>(
    `${basePath}/exports/on-behalf-of`,
    request
  );
  return data;
}

// ── Export Downloads (blob/stream) ────────────────────────────────────────────

/**
 * Downloads the personal data export archive (compat — single-shard or manifest).
 *
 * Returns a streaming response. Use `adapter: 'fetch', responseType: 'stream'`
 * to handle the binary payload.
 *
 * `GET {basePath}/exports/{requestId}/download`
 */
export async function downloadExport(
  client: AxiosInstance,
  basePath: string,
  requestId: string
): Promise<ReadableStream> {
  const { data } = await client.get<ReadableStream>(
    `${basePath}/exports/${encodeURIComponent(requestId)}/download`,
    { adapter: 'fetch', responseType: 'stream' }
  );
  return data;
}

/**
 * Downloads the manifest sidecar describing the export's shards.
 *
 * `GET {basePath}/exports/{requestId}/download/manifest`
 */
export async function downloadExportManifest(
  client: AxiosInstance,
  basePath: string,
  requestId: string
): Promise<ReadableStream> {
  const { data } = await client.get<ReadableStream>(
    `${basePath}/exports/${encodeURIComponent(requestId)}/download/manifest`,
    { adapter: 'fetch', responseType: 'stream' }
  );
  return data;
}

/**
 * Downloads a single shard of a sharded personal data export.
 *
 * `GET {basePath}/exports/{requestId}/download/{shardIndex}`
 */
export async function downloadExportShard(
  client: AxiosInstance,
  basePath: string,
  requestId: string,
  shardIndex: number
): Promise<ReadableStream> {
  const { data } = await client.get<ReadableStream>(
    `${basePath}/exports/${encodeURIComponent(requestId)}/download/${shardIndex}`,
    { adapter: 'fetch', responseType: 'stream' }
  );
  return data;
}
