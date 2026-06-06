import { getPage, getQueryMeta } from '@granit/query-engine';
import { executeStateMachineTransition, listTransitions } from '@granit/workflow';

import type {
  CancelInvoiceRequest,
  FinalizeInvoiceRequest,
  InvoiceCreateRequest,
  InvoiceResponse,
  MarkInvoiceUncollectibleRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult, QueryMetadata, QueryRequest } from '@granit/query-engine';
import type {
  WorkflowStatus,
  WorkflowTransitionRequest,
  WorkflowTransitionResult,
} from '@granit/workflow';

/**
 * Query invoices with filtering, sorting, and pagination (Query Engine).
 *
 * `GET {basePath}/invoices`
 */
export async function queryInvoices(
  client: AxiosInstance,
  basePath: string,
  request: QueryRequest = {}
): Promise<PagedResult<InvoiceResponse>> {
  return getPage<InvoiceResponse>(client, `${basePath}/invoices`, request);
}

/**
 * Get query metadata for invoices (columns, filters, sorts, presets).
 *
 * `GET {basePath}/invoices/meta`
 */
export async function getInvoiceMeta(
  client: AxiosInstance,
  basePath: string
): Promise<QueryMetadata> {
  return getQueryMeta(client, `${basePath}/invoices`);
}

/**
 * Fetch a single invoice by ID.
 *
 * `GET {basePath}/invoices/{id}`
 */
export async function getInvoiceById(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<InvoiceResponse> {
  const response = await client.get<InvoiceResponse>(
    `${basePath}/invoices/${encodeURIComponent(id)}`
  );
  return response.data;
}

/**
 * Download the PDF for an invoice.
 *
 * `GET {basePath}/invoices/{id}/pdf`
 *
 * Returns a `Blob` suitable for client-side download.
 */
export async function downloadInvoicePdf(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<Blob> {
  const response = await client.get<Blob>(`${basePath}/invoices/${encodeURIComponent(id)}/pdf`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Create a new invoice.
 *
 * `POST {basePath}/invoices`
 */
export async function createInvoice(
  client: AxiosInstance,
  basePath: string,
  request: InvoiceCreateRequest
): Promise<InvoiceResponse> {
  const response = await client.post<InvoiceResponse>(`${basePath}/invoices`, request);
  return response.data;
}

/**
 * Finalize a Draft invoice (Draft → Open).
 *
 * `POST {basePath}/invoices/{id}/finalize`
 */
export async function finalizeInvoice(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: FinalizeInvoiceRequest
): Promise<InvoiceResponse> {
  const response = await client.post<InvoiceResponse>(
    `${basePath}/invoices/${encodeURIComponent(id)}/finalize`,
    request
  );
  return response.data;
}

/**
 * Cancel an invoice (Open / Uncollectible → Cancelled).
 *
 * `POST {basePath}/invoices/{id}/cancel`
 */
export async function cancelInvoice(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: CancelInvoiceRequest = {}
): Promise<InvoiceResponse> {
  const response = await client.post<InvoiceResponse>(
    `${basePath}/invoices/${encodeURIComponent(id)}/cancel`,
    request
  );
  return response.data;
}

/**
 * Mark an Open invoice as Uncollectible (bad debt).
 *
 * `POST {basePath}/invoices/{id}/mark-uncollectible`
 */
export async function markInvoiceUncollectible(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: MarkInvoiceUncollectibleRequest = {}
): Promise<InvoiceResponse> {
  const response = await client.post<InvoiceResponse>(
    `${basePath}/invoices/${encodeURIComponent(id)}/mark-uncollectible`,
    request
  );
  return response.data;
}

/**
 * Get available workflow transitions for a given invoice status.
 *
 * `GET {basePath}/invoices/transitions?currentState=...`
 */
export async function listInvoiceTransitions(
  client: AxiosInstance,
  basePath: string,
  currentState: string
): Promise<WorkflowStatus> {
  return listTransitions(client, `${basePath}/invoices`, currentState);
}

/**
 * Execute a workflow transition for invoices.
 *
 * `POST {basePath}/invoices/transitions?currentState=...`
 */
export async function executeInvoiceTransition(
  client: AxiosInstance,
  basePath: string,
  currentState: string,
  request: WorkflowTransitionRequest
): Promise<WorkflowTransitionResult> {
  return executeStateMachineTransition(client, `${basePath}/invoices`, currentState, request);
}
