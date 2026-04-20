// ---------------------------------------------------------------------------
// Provider discovery API functions.
// Mirrors Granit.AI.Endpoints provider listing endpoints.
// ---------------------------------------------------------------------------

import type { AIProviderModelResponse, AIProviderResponse } from '../types/index.js';
import type { AxiosInstance } from 'axios';

/**
 * List all registered AI providers.
 *
 * `GET {basePath}/providers`
 */
export async function listAIProviders(
  client: AxiosInstance,
  basePath: string
): Promise<AIProviderResponse[]> {
  const response = await client.get<AIProviderResponse[]>(`${basePath}/providers`);
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
): Promise<AIProviderModelResponse[]> {
  const response = await client.get<AIProviderModelResponse[]>(
    `${basePath}/providers/${encodeURIComponent(providerName)}/models`
  );
  return response.data;
}
