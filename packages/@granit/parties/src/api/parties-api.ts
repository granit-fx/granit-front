import type {
  PartyAddressId,
  PartyAddressRequest,
  PartyCreateRequest,
  PartyEmailId,
  PartyEmailRequest,
  PartyExternalMappingRequest,
  PartyId,
  PartyListItemResponse,
  PartyPhoneId,
  PartyPhoneRequest,
  PartyResponse,
  PartyRole,
  PartyRoleRequest,
  PartyRoles,
  PartySuspendRequest,
  PartyTaxStatusRequest,
  PartyUpdateRequest,
} from '../types.js';
import type { AxiosInstance } from 'axios';

/**
 * List parties in the active scope, optionally filtered by role flag.
 *
 * `GET {basePath}`
 */
export async function listParties(
  client: AxiosInstance,
  basePath: string,
  options?: { readonly role?: PartyRoles }
): Promise<readonly PartyListItemResponse[]> {
  const response = await client.get<readonly PartyListItemResponse[]>(basePath, {
    params: options?.role ? { role: options.role } : undefined,
  });
  return response.data;
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
 * `POST {basePath}`
 */
export async function createParty(
  client: AxiosInstance,
  basePath: string,
  request: PartyCreateRequest
): Promise<PartyResponse> {
  const response = await client.post<PartyResponse>(basePath, request);
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
