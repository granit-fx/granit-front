import { getPage, getQueryMeta } from '@granit/query-engine';

import type {
  BankAccount,
  BankAccountListParams,
  BankAccountPage,
  BankAccountResponse,
  CreateBankAccountRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { QueryMetadata } from '@granit/query-engine';

// ---------------------------------------------------------------------------
// CRUD + lifecycle
// ---------------------------------------------------------------------------

/**
 * Register a bank account for a party. The account identifier is encrypted at
 * rest; the response masks it. Requires `BankAccounts.Accounts.Manage`.
 *
 * `POST {basePath}`
 */
export async function createBankAccount(
  client: AxiosInstance,
  basePath: string,
  request: CreateBankAccountRequest
): Promise<BankAccountResponse> {
  const response = await client.post<BankAccountResponse>(basePath, request);
  return response.data;
}

/**
 * Get a single bank account by ID, with the account identifier masked. Scoped
 * to the current tenant. Requires `BankAccounts.Accounts.Read`.
 *
 * `GET {basePath}/{id}`
 */
export async function getBankAccount(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<BankAccountResponse> {
  const response = await client.get<BankAccountResponse>(`${basePath}/${encodeURIComponent(id)}`);
  return response.data;
}

/**
 * List the non-archived bank accounts of a party (the app-facing per-party
 * view). Requires `BankAccounts.Accounts.Read`.
 *
 * `GET {basePath}/by-party/{partyId}`
 */
export async function listBankAccountsByParty(
  client: AxiosInstance,
  basePath: string,
  partyId: string
): Promise<readonly BankAccountResponse[]> {
  const response = await client.get<readonly BankAccountResponse[]>(
    `${basePath}/by-party/${encodeURIComponent(partyId)}`
  );
  return response.data;
}

/**
 * Mark a bank account as verified (proof of ownership). Idempotent: re-verifying
 * an already-verified account succeeds. Requires `BankAccounts.Accounts.Verify`.
 *
 * `POST {basePath}/{id}/verify`
 */
export async function verifyBankAccount(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<BankAccountResponse> {
  const response = await client.post<BankAccountResponse>(
    `${basePath}/${encodeURIComponent(id)}/verify`
  );
  return response.data;
}

/**
 * Archive (soft-delete) a bank account so it no longer appears in a party's
 * active list; the record is retained for audit/regulatory purposes.
 * Idempotent. Requires `BankAccounts.Accounts.Manage`.
 *
 * `DELETE {basePath}/{id}`
 */
export async function archiveBankAccount(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/${encodeURIComponent(id)}`);
}

// ---------------------------------------------------------------------------
// QueryEngine — cross-tenant admin grid (GET {basePath} + /meta)
// ---------------------------------------------------------------------------

/**
 * List bank accounts via the QueryEngine admin grid (paginated, filterable,
 * cross-tenant). Requires `BankAccounts.Accounts.Read`.
 *
 * `GET {basePath}`
 */
export async function listBankAccounts(
  client: AxiosInstance,
  basePath: string,
  params?: BankAccountListParams
): Promise<BankAccountPage> {
  return getPage<BankAccount>(client, basePath, params ?? {});
}

/**
 * Get the QueryEngine metadata (columns, filterable fields, presets) for the
 * bank account grid.
 *
 * `GET {basePath}/meta`
 */
export async function getBankAccountsQueryMeta(
  client: AxiosInstance,
  basePath: string
): Promise<QueryMetadata> {
  return getQueryMeta(client, basePath);
}
