import type {
  PaymentAttachMethodRequest,
  PaymentAvailableMethodResponse,
  PaymentChargeRequest,
  PaymentCheckoutRequest,
  PaymentCheckoutSessionResponse,
  PaymentMethodId,
  PaymentMethodResponse,
  PaymentRefundRequest,
  PaymentRefundResponse,
  PaymentTransactionId,
  PaymentTransactionResponse,
} from '../types.js';
import type { AxiosInstance } from 'axios';

/**
 * List all payment transactions.
 *
 * `GET {basePath}/transactions`
 */
export async function listPaymentTransactions(
  client: AxiosInstance,
  basePath: string
): Promise<readonly PaymentTransactionResponse[]> {
  const response = await client.get<readonly PaymentTransactionResponse[]>(
    `${basePath}/transactions`
  );
  return response.data;
}

/**
 * Get a single payment transaction by ID.
 *
 * `GET {basePath}/transactions/{id}`
 */
export async function getPaymentTransaction(
  client: AxiosInstance,
  basePath: string,
  id: PaymentTransactionId
): Promise<PaymentTransactionResponse> {
  const response = await client.get<PaymentTransactionResponse>(
    `${basePath}/transactions/${encodeURIComponent(id)}`
  );
  return response.data;
}

/**
 * Initiate a payment charge.
 *
 * `POST {basePath}/charge`
 */
export async function initiatePaymentCharge(
  client: AxiosInstance,
  basePath: string,
  request: PaymentChargeRequest
): Promise<PaymentTransactionResponse> {
  const response = await client.post<PaymentTransactionResponse>(`${basePath}/charge`, request);
  return response.data;
}

/**
 * Request a payment refund.
 *
 * `POST {basePath}/refund`
 */
export async function requestPaymentRefund(
  client: AxiosInstance,
  basePath: string,
  request: PaymentRefundRequest
): Promise<PaymentRefundResponse> {
  const response = await client.post<PaymentRefundResponse>(`${basePath}/refund`, request);
  return response.data;
}

/**
 * Create a checkout session. Returns a URL for redirect.
 *
 * `POST {basePath}/checkout`
 */
export async function createCheckoutSession(
  client: AxiosInstance,
  basePath: string,
  request: PaymentCheckoutRequest
): Promise<PaymentCheckoutSessionResponse> {
  const response = await client.post<PaymentCheckoutSessionResponse>(
    `${basePath}/checkout`,
    request
  );
  return response.data;
}

/**
 * List attached payment methods.
 *
 * `GET {basePath}/methods`
 */
export async function listPaymentMethods(
  client: AxiosInstance,
  basePath: string
): Promise<readonly PaymentMethodResponse[]> {
  const response = await client.get<readonly PaymentMethodResponse[]>(`${basePath}/methods`);
  return response.data;
}

/**
 * Get available payment methods for the current provider.
 *
 * `GET {basePath}/methods/available`
 */
export async function getAvailablePaymentMethods(
  client: AxiosInstance,
  basePath: string
): Promise<readonly PaymentAvailableMethodResponse[]> {
  const response = await client.get<readonly PaymentAvailableMethodResponse[]>(
    `${basePath}/methods/available`
  );
  return response.data;
}

/**
 * Attach a payment method.
 *
 * `POST {basePath}/methods`
 */
export async function attachPaymentMethod(
  client: AxiosInstance,
  basePath: string,
  request: PaymentAttachMethodRequest
): Promise<PaymentMethodResponse> {
  const response = await client.post<PaymentMethodResponse>(`${basePath}/methods`, request);
  return response.data;
}

/**
 * Detach a payment method by ID.
 *
 * `DELETE {basePath}/methods/{id}`
 */
export async function detachPaymentMethod(
  client: AxiosInstance,
  basePath: string,
  id: PaymentMethodId
): Promise<void> {
  await client.delete(`${basePath}/methods/${encodeURIComponent(id)}`);
}
