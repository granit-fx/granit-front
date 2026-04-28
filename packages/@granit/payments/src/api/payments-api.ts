import type {
  PaymentAttachMethodRequest,
  PaymentAvailabilityContext,
  PaymentAvailableMethodResponse,
  PaymentChargeRequest,
  PaymentCheckoutRequest,
  PaymentCheckoutSessionResponse,
  PaymentMethodConfigurationItem,
  PaymentMethodResponse,
  PaymentProviderCatalogResponse,
  PaymentProviderConfiguration,
  PaymentRefundRequest,
  PaymentRefundResponse,
  PaymentTransactionResponse,
} from '../types.js';
import type { AxiosInstance } from '@granit/api-client';

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
  id: string
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
 * Get available payment methods, optionally filtered by a runtime `context`
 * (country / currency / amount / sequence type).
 *
 * Each axis is independently optional — only defined keys are sent as query
 * parameters. Undefined axes are treated as wildcard by the backend. The SDK
 * intentionally does not re-apply the backend's `sequenceType="oneoff"` default
 * when `amount` is provided — the backend owns that policy.
 *
 * `GET {basePath}/methods/available`
 */
export async function getAvailablePaymentMethods(
  client: AxiosInstance,
  basePath: string,
  context?: PaymentAvailabilityContext
): Promise<readonly PaymentAvailableMethodResponse[]> {
  const params = buildAvailabilityParams(context);
  const response = await client.get<readonly PaymentAvailableMethodResponse[]>(
    `${basePath}/methods/available`,
    params ? { params } : undefined
  );
  return response.data;
}

function buildAvailabilityParams(
  context: PaymentAvailabilityContext | undefined
): Record<string, string | number> | undefined {
  if (!context) {
    return undefined;
  }
  const params: Record<string, string | number> = {};
  if (context.country !== undefined) params.country = context.country;
  if (context.currency !== undefined) params.currency = context.currency;
  if (context.amount !== undefined) params.amount = context.amount;
  if (context.sequenceType !== undefined) params.sequenceType = context.sequenceType;
  return Object.keys(params).length > 0 ? params : undefined;
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
  id: string
): Promise<void> {
  await client.delete(`${basePath}/methods/${encodeURIComponent(id)}`);
}

/**
 * List platform-level payment method configurations (host admin only).
 * Returns the fused view of all payment methods declared by installed providers,
 * grouped by provider, with their current activation state.
 *
 * `GET {basePath}/configuration`
 */
export async function listPaymentMethodConfigurations(
  client: AxiosInstance,
  basePath: string
): Promise<readonly PaymentProviderConfiguration[]> {
  const response = await client.get<readonly PaymentProviderConfiguration[]>(
    `${basePath}/configuration`
  );
  return response.data;
}

/**
 * Activate a payment method for the platform (idempotent).
 * The admin toggles on/off methods declared by the installed providers.
 *
 * `POST {basePath}/configuration/{provider}/{method}/activate`
 */
export async function activatePaymentMethod(
  client: AxiosInstance,
  basePath: string,
  providerName: string,
  methodType: string
): Promise<PaymentMethodConfigurationItem> {
  const response = await client.post<PaymentMethodConfigurationItem>(
    `${basePath}/configuration/${encodeURIComponent(providerName)}/${encodeURIComponent(methodType)}/activate`
  );
  return response.data;
}

/**
 * Deactivate a payment method for the platform (idempotent).
 *
 * `POST {basePath}/configuration/{provider}/{method}/deactivate`
 */
export async function deactivatePaymentMethod(
  client: AxiosInstance,
  basePath: string,
  providerName: string,
  methodType: string
): Promise<PaymentMethodConfigurationItem> {
  const response = await client.post<PaymentMethodConfigurationItem>(
    `${basePath}/configuration/${encodeURIComponent(providerName)}/${encodeURIComponent(methodType)}/deactivate`
  );
  return response.data;
}

/**
 * Fetch the live catalog of payment methods advertised by a provider, along
 * with per-method activation state and snapshot presence. Drives the admin
 * "Browse provider catalog" view.
 *
 * `GET {basePath}/configuration/catalog?providerName={providerName}`
 */
export async function getPaymentProviderCatalog(
  client: AxiosInstance,
  basePath: string,
  providerName: string
): Promise<PaymentProviderCatalogResponse> {
  const response = await client.get<PaymentProviderCatalogResponse>(
    `${basePath}/configuration/catalog`,
    { params: { providerName } }
  );
  return response.data;
}

/**
 * Re-fetch the provider catalog and overwrite the stored capability snapshot
 * for an already-activated method. The backend returns 404 when the method is
 * not activated and 400 when the provider no longer offers it.
 *
 * `POST {basePath}/configuration/{provider}/{method}/resync`
 */
export async function resyncPaymentMethodConfiguration(
  client: AxiosInstance,
  basePath: string,
  providerName: string,
  methodType: string
): Promise<PaymentMethodConfigurationItem> {
  const response = await client.post<PaymentMethodConfigurationItem>(
    `${basePath}/configuration/${encodeURIComponent(providerName)}/${encodeURIComponent(methodType)}/resync`
  );
  return response.data;
}
