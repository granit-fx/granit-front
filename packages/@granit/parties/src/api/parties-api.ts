import { executeMerge, previewMerge } from '@granit/entity-merge';

import type {
  CreatePartyOptions,
  PartyAddressId,
  PartyAddressRequest,
  PartyCreateRequest,
  PartyEmailId,
  PartyEmailRequest,
  PartyExternalMappingRequest,
  PartyId,
  PartyListItemResponse,
  PartyMergeRequest,
  PartyMergeResponse,
  PartyMetadataRequest,
  PartyPhoneId,
  PartyPhoneRequest,
  PartyResponse,
  PartyRole,
  PartyRoleRequest,
  PartySuspendRequest,
  PartyTaxStatusRequest,
  PartyUpdateRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List parties in the active scope, optionally filtered by role flag.
 *
 * `GET {basePath}` — `MapGranitQuery<Party>()` paged envelope.
 */
export async function listParties(
  client: AxiosInstance,
  basePath: string,
  options?: { readonly role?: string }
): Promise<readonly PartyListItemResponse[]> {
  const params: Record<string, string | number> = { pageSize: 100 };
  if (options?.role) params.role = options.role;
  const response = await client.get<{ readonly items: readonly PartyListItemResponse[] }>(
    basePath,
    { params }
  );
  return response.data.items;
}

/**
 * Fetch a single party by id.
 *
 * `GET {basePath}/{id}`
 */
export async function getPartyById(
  client: AxiosInstance,
  basePath: string,
  id: PartyId
): Promise<PartyResponse> {
  const response = await client.get<PartyResponse>(`${basePath}/${encodeURIComponent(id)}`);
  return response.data;
}

/**
 * Create a new party.
 *
 * `POST {basePath}` — returns the created party on 200/201.
 *
 * On a Tier-1 (Deterministic) duplicate match the server returns 409 with a
 * {@link PartyCreateConflictResponse} body in `error.response.data`. Callers
 * that want to suppress the check on a per-call basis can pass
 * `options.force: true` (URL flag) or `options.skipDuplicateCheck: true`
 * (header) — see {@link CreatePartyOptions}.
 */
export async function createParty(
  client: AxiosInstance,
  basePath: string,
  request: PartyCreateRequest,
  options?: CreatePartyOptions
): Promise<PartyResponse> {
  const params = options?.force ? { force: true } : undefined;
  const headers = options?.skipDuplicateCheck ? { 'X-Skip-Duplicate-Check': 'true' } : undefined;
  const response = await client.post<PartyResponse>(basePath, request, {
    params,
    headers,
  });
  return response.data;
}

/**
 * Update a party's identity (name / website / language / timezone).
 *
 * `PATCH {basePath}/{id}`
 */
export async function updateParty(
  client: AxiosInstance,
  basePath: string,
  id: PartyId,
  request: PartyUpdateRequest
): Promise<PartyResponse> {
  const response = await client.patch<PartyResponse>(
    `${basePath}/${encodeURIComponent(id)}`,
    request
  );
  return response.data;
}

/**
 * Suspend a party (idempotent; throws 409 on Archived).
 *
 * `POST {basePath}/{id}/suspend`
 */
export async function suspendParty(
  client: AxiosInstance,
  basePath: string,
  id: PartyId,
  request?: PartySuspendRequest
): Promise<void> {
  await client.post(`${basePath}/${encodeURIComponent(id)}/suspend`, request ?? {});
}

/**
 * Reactivate a suspended party (idempotent; throws 409 on Archived).
 *
 * `POST {basePath}/{id}/activate`
 */
export async function activateParty(
  client: AxiosInstance,
  basePath: string,
  id: PartyId
): Promise<void> {
  await client.post(`${basePath}/${encodeURIComponent(id)}/activate`);
}

/**
 * Archive a party (terminal state). Idempotent.
 *
 * `POST {basePath}/{id}/archive`
 */
export async function archiveParty(
  client: AxiosInstance,
  basePath: string,
  id: PartyId
): Promise<void> {
  await client.post(`${basePath}/${encodeURIComponent(id)}/archive`);
}

// ── Addresses ────────────────────────────────────────────────────────────

/**
 * Add a typed address to a party.
 *
 * `POST {basePath}/{id}/addresses`
 */
export async function addPartyAddress(
  client: AxiosInstance,
  basePath: string,
  id: PartyId,
  request: PartyAddressRequest
): Promise<PartyResponse> {
  const response = await client.post<PartyResponse>(
    `${basePath}/${encodeURIComponent(id)}/addresses`,
    request
  );
  return response.data;
}

/**
 * Remove an address from a party. Idempotent.
 *
 * `DELETE {basePath}/{id}/addresses/{addressId}`
 */
export async function removePartyAddress(
  client: AxiosInstance,
  basePath: string,
  id: PartyId,
  addressId: PartyAddressId
): Promise<void> {
  await client.delete(
    `${basePath}/${encodeURIComponent(id)}/addresses/${encodeURIComponent(addressId)}`
  );
}

// ── Emails ───────────────────────────────────────────────────────────────

/**
 * Add an email to a party.
 *
 * `POST {basePath}/{id}/emails`
 */
export async function addPartyEmail(
  client: AxiosInstance,
  basePath: string,
  id: PartyId,
  request: PartyEmailRequest
): Promise<PartyResponse> {
  const response = await client.post<PartyResponse>(
    `${basePath}/${encodeURIComponent(id)}/emails`,
    request
  );
  return response.data;
}

/**
 * Remove an email from a party. Idempotent.
 *
 * `DELETE {basePath}/{id}/emails/{emailId}`
 */
export async function removePartyEmail(
  client: AxiosInstance,
  basePath: string,
  id: PartyId,
  emailId: PartyEmailId
): Promise<void> {
  await client.delete(
    `${basePath}/${encodeURIComponent(id)}/emails/${encodeURIComponent(emailId)}`
  );
}

// ── Phones ───────────────────────────────────────────────────────────────

/**
 * Add a typed phone number to a party.
 *
 * `POST {basePath}/{id}/phones`
 */
export async function addPartyPhone(
  client: AxiosInstance,
  basePath: string,
  id: PartyId,
  request: PartyPhoneRequest
): Promise<PartyResponse> {
  const response = await client.post<PartyResponse>(
    `${basePath}/${encodeURIComponent(id)}/phones`,
    request
  );
  return response.data;
}

/**
 * Remove a phone number from a party. Idempotent.
 *
 * `DELETE {basePath}/{id}/phones/{phoneId}`
 */
export async function removePartyPhone(
  client: AxiosInstance,
  basePath: string,
  id: PartyId,
  phoneId: PartyPhoneId
): Promise<void> {
  await client.delete(
    `${basePath}/${encodeURIComponent(id)}/phones/${encodeURIComponent(phoneId)}`
  );
}

// ── External mappings (one per provider) ─────────────────────────────────

/**
 * Register a polyglot external mapping (Stripe / Mollie / Odoo / …).
 * Returns 409 Conflict if a mapping for the same provider already exists.
 *
 * `POST {basePath}/{id}/external-mappings`
 */
export async function addPartyExternalMapping(
  client: AxiosInstance,
  basePath: string,
  id: PartyId,
  request: PartyExternalMappingRequest
): Promise<PartyResponse> {
  const response = await client.post<PartyResponse>(
    `${basePath}/${encodeURIComponent(id)}/external-mappings`,
    request
  );
  return response.data;
}

/**
 * Remove the party's external mapping for the given provider. Idempotent.
 *
 * `DELETE {basePath}/{id}/external-mappings/{providerName}`
 */
export async function removePartyExternalMapping(
  client: AxiosInstance,
  basePath: string,
  id: PartyId,
  providerName: string
): Promise<void> {
  await client.delete(
    `${basePath}/${encodeURIComponent(id)}/external-mappings/${encodeURIComponent(providerName)}`
  );
}

// ── Roles ────────────────────────────────────────────────────────────────

/**
 * Add a role flag to a party. Idempotent.
 *
 * `POST {basePath}/{id}/roles`
 */
export async function addPartyRole(
  client: AxiosInstance,
  basePath: string,
  id: PartyId,
  request: PartyRoleRequest
): Promise<void> {
  await client.post(`${basePath}/${encodeURIComponent(id)}/roles`, request);
}

/**
 * Remove a role flag from a party. Idempotent.
 *
 * `DELETE {basePath}/{id}/roles/{role}`
 */
export async function removePartyRole(
  client: AxiosInstance,
  basePath: string,
  id: PartyId,
  role: PartyRole
): Promise<void> {
  await client.delete(`${basePath}/${encodeURIComponent(id)}/roles/${encodeURIComponent(role)}`);
}

// ── Tax status ───────────────────────────────────────────────────────────

/**
 * Apply a customer-specific tax status (exempt / reverse-charge) to a party.
 *
 * `PUT {basePath}/{id}/tax-status`
 */
export async function setPartyTaxStatus(
  client: AxiosInstance,
  basePath: string,
  id: PartyId,
  request: PartyTaxStatusRequest
): Promise<PartyResponse> {
  const response = await client.put<PartyResponse>(
    `${basePath}/${encodeURIComponent(id)}/tax-status`,
    request
  );
  return response.data;
}

/**
 * Reset a party's tax status to the default (no special classification). Idempotent.
 *
 * `DELETE {basePath}/{id}/tax-status`
 */
export async function clearPartyTaxStatus(
  client: AxiosInstance,
  basePath: string,
  id: PartyId
): Promise<PartyResponse> {
  const response = await client.delete<PartyResponse>(
    `${basePath}/${encodeURIComponent(id)}/tax-status`
  );
  return response.data;
}

// ── Metadata & vCard ─────────────────────────────────────────────────────

/**
 * Bulk-replace a party's free-form metadata dictionary. Pass `{ metadata: {} }`
 * to clear all entries. Capped server-side at 50 entries (key ≤ 40 chars,
 * value ≤ 500 chars).
 *
 * `PUT {basePath}/{id}/metadata`
 */
export async function replacePartyMetadata(
  client: AxiosInstance,
  basePath: string,
  id: PartyId,
  request: PartyMetadataRequest
): Promise<PartyResponse> {
  const response = await client.put<PartyResponse>(
    `${basePath}/${encodeURIComponent(id)}/metadata`,
    request
  );
  return response.data;
}

/**
 * Download the party's vCard 4.0 (RFC 6350) representation. The returned `Blob`
 * carries `text/vcard; charset=utf-8` content suitable for client-side download
 * or import into address-book apps.
 *
 * `GET {basePath}/{id}/vcard`
 */
export async function downloadPartyVCard(
  client: AxiosInstance,
  basePath: string,
  id: PartyId
): Promise<Blob> {
  const response = await client.get<Blob>(`${basePath}/${encodeURIComponent(id)}/vcard`, {
    responseType: 'blob',
  });
  return response.data;
}

// ── Merge ────────────────────────────────────────────────────────────────
// Delegates to the aggregate-agnostic client in `@granit/entity-merge`; the
// party-typed signatures are preserved for consumers.

/**
 * Compute a dry-run preview of merging `loserId` into `survivorId`. Returns
 * per-field conflicts (with the recommended winner pre-populated) and the
 * cross-module rewrite counts that a live merge would apply. Pure read — no
 * DB changes. Powers the admin merge wizard's side-by-side view.
 *
 * `GET {basePath}/{survivorId}/merge/preview?loserId={loserId}`
 */
export function previewPartyMerge(
  client: AxiosInstance,
  basePath: string,
  survivorId: PartyId,
  loserId: PartyId
): Promise<PartyMergeResponse> {
  return previewMerge<PartyId>(client, basePath, survivorId, loserId);
}

/**
 * Run the live merge of `request.loserId` into `survivorId`. The loser is
 * tombstoned and foreign-key references in Invoicing / Subscriptions /
 * Payments / CustomerBalance are rewritten inside a single transaction.
 *
 * Pass an `idempotencyKey` (UUID recommended) to make retries safe — the
 * orchestrator caches the first result and returns 409 on a key reuse with a
 * different payload.
 *
 * `POST {basePath}/{survivorId}/merge` (with optional `Idempotency-Key` header)
 */
export function mergeParty(
  client: AxiosInstance,
  basePath: string,
  survivorId: PartyId,
  request: PartyMergeRequest,
  idempotencyKey?: string
): Promise<PartyMergeResponse> {
  return executeMerge<PartyId>(client, basePath, survivorId, request, idempotencyKey);
}
