// ---------------------------------------------------------------------------
// Provider discovery API functions.
// Mirrors Granit.AI.Endpoints provider listing endpoints.
// ---------------------------------------------------------------------------

import type { AIProviderModelResponse, AIProviderResponse } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List all registered AI providers.
 *
 * `GET {basePath}/providers`
 */
export async function listAIProviders(
  client: AxiosInstance,
  basePath: string
): Promise<readonly AIProviderResponse[]> {
  const response = await client.get<readonly AIProviderResponse[]>(`${basePath}/providers`);
  return response.data;
}

/**
 * List available models for a given provider.
 *
 * `GET {basePath}/providers/{providerName}/models`
 */
export async function listAIProviderModels(
  client: AxiosInstance,
  basePath: string,
  providerName: string
): Promise<readonly AIProviderModelResponse[]> {
  const response = await client.get<readonly AIProviderModelResponse[]>(
    `${basePath}/providers/${encodeURIComponent(providerName)}/models`
  );
  return response.data;
}
