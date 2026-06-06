import type {
  AdminCreditRequest,
  AdminDebitRequest,
  BalanceTransactionResponse,
  CustomerBalanceResponse,
  ListBalanceTransactionsParams,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Fetch the current customer balance for a given currency.
 *
 * `GET {basePath}/balance?currency=EUR`
 */
export async function getCustomerBalance(
  client: AxiosInstance,
  basePath: string,
  currency: string
): Promise<CustomerBalanceResponse> {
  const response = await client.get<CustomerBalanceResponse>(`${basePath}/balance`, {
    params: { currency },
  });
  return response.data;
}

/**
 * List paginated balance transactions for a given currency.
 *
 * `GET {basePath}/transactions?currency=EUR&page=1&pageSize=25`
 */
export async function listBalanceTransactions(
  client: AxiosInstance,
  basePath: string,
  params: ListBalanceTransactionsParams
): Promise<readonly BalanceTransactionResponse[]> {
  const response = await client.get<readonly BalanceTransactionResponse[]>(
    `${basePath}/transactions`,
    { params }
  );
  return response.data;
}

/**
 * Add an administrative credit to a party's balance.
 *
 * `POST {basePath}/balance/credit`
 */
export async function addAdminCredit(
  client: AxiosInstance,
  basePath: string,
  request: AdminCreditRequest
): Promise<CustomerBalanceResponse> {
  const response = await client.post<CustomerBalanceResponse>(
    `${basePath}/balance/credit`,
    request
  );
  return response.data;
}

/**
 * Apply a manual debit to a party's balance (admin tooling).
 *
 * `POST {basePath}/balance/debit`
 */
export async function applyAdminDebit(
  client: AxiosInstance,
  basePath: string,
  request: AdminDebitRequest
): Promise<CustomerBalanceResponse> {
  const response = await client.post<CustomerBalanceResponse>(`${basePath}/balance/debit`, request);
  return response.data;
}
