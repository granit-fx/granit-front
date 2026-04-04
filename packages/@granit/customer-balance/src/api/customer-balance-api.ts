import type {
  AdminCreditRequest,
  BalanceTransactionResponse,
  CustomerBalanceResponse,
} from '../types.js';
import type { AxiosInstance } from 'axios';

/**
 * Fetch the current customer balance.
 *
 * `GET {basePath}/balance`
 */
export async function getCustomerBalance(
  client: AxiosInstance,
  basePath: string
): Promise<CustomerBalanceResponse> {
  const response = await client.get<CustomerBalanceResponse>(`${basePath}/balance`);
  return response.data;
}

/**
 * List all balance transactions.
 *
 * `GET {basePath}/transactions`
 */
export async function listBalanceTransactions(
  client: AxiosInstance,
  basePath: string
): Promise<readonly BalanceTransactionResponse[]> {
  const response = await client.get<readonly BalanceTransactionResponse[]>(
    `${basePath}/transactions`
  );
  return response.data;
}

/**
 * Add an administrative credit to the customer balance.
 *
 * `POST {basePath}/credit`
 */
export async function addAdminCredit(
  client: AxiosInstance,
  basePath: string,
  request: AdminCreditRequest
): Promise<void> {
  await client.post(`${basePath}/credit`, request);
}
