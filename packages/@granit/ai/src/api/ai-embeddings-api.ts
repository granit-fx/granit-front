// ---------------------------------------------------------------------------
// Embedding generation API functions.
// Mirrors Granit.AI.Endpoints embedding endpoint.
// ---------------------------------------------------------------------------

import type { AIEmbeddingRequest, AIEmbeddingResponse } from '../types/index.js';
import type { AxiosInstance } from 'axios';

/**
 * Generate embeddings for a batch of text inputs.
 *
 * `POST {basePath}/embeddings/{workspaceName}`
 */
export async function generateEmbeddings(
  client: AxiosInstance,
  basePath: string,
  workspaceName: string,
  request: AIEmbeddingRequest
): Promise<AIEmbeddingResponse> {
  const response = await client.post<AIEmbeddingResponse>(
    `${basePath}/embeddings/${encodeURIComponent(workspaceName)}`,
    request
  );
  return response.data;
}
