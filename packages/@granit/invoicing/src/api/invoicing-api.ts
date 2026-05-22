import type {
  CancelInvoiceRequest,
  FinalizeInvoiceRequest,
  InvoiceCreateRequest,
  InvoiceResponse,
  MarkInvoiceUncollectibleRequest,
} from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List all invoices.
 *
 * `GET {basePath}/invoices`
 */
export async function listInvoices(
  client: AxiosInstance,
  basePath: string
): Promise<readonly InvoiceResponse[]> {
  const response = await client.get<readonly InvoiceResponse[]>(`${basePath}/invoices`);
  return response.data;
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
 * Delegates the transition to the backend `IWorkflowManager<InvoiceStatus>`;
 * the next document number is generated server-side.
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
