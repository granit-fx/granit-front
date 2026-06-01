import type {
  ServerValidationBatchRequest,
  ServerValidationBatchResponse,
  ServerValidationResult,
  ValidationStatus,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

const DEFAULT_BASE_PATH = '/api/v1/validation';

/** List the available server validator error codes. */
export async function listValidators(
  client: AxiosInstance,
  basePath: string = DEFAULT_BASE_PATH
): Promise<string[]> {
  const { data } = await client.get<string[]>(`${basePath}/validators`);
  return data;
}

/** Validate a single field value against a server-side validator. */
export async function validateFieldServer(
  client: AxiosInstance,
  errorCode: string,
  value: unknown,
  basePath: string = DEFAULT_BASE_PATH,
  signal?: AbortSignal
): Promise<ValidationStatus> {
  const { data } = await client.post<ServerValidationResult>(
    `${basePath}/validate`,
    { errorCode, value },
    { signal }
  );
  return data.status;
}

/** Validate multiple fields in a single batch request. */
export async function validateFieldsBatch(
  client: AxiosInstance,
  fields: readonly { errorCode: string; value: unknown }[],
  basePath: string = DEFAULT_BASE_PATH,
  signal?: AbortSignal
): Promise<readonly ServerValidationResult[]> {
  const { data } = await client.post<ServerValidationBatchResponse>(
    `${basePath}/validate-batch`,
    { fields } satisfies ServerValidationBatchRequest,
    { signal }
  );
  return data.results;
}
