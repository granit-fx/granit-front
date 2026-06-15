// ---------------------------------------------------------------------------
// Prompt catalogue API functions.
// Mirrors Granit.AI.Prompts.Endpoints — CRUD, the `/` picker, and
// copy-on-customise. Routes are relative to `basePath` (the `/prompts` prefix).
// ---------------------------------------------------------------------------

import type {
  CreatePromptRequest,
  PromptId,
  PromptPickerResponse,
  PromptResponse,
  PromptSummaryResponse,
  UpdatePromptRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List the caller's catalogue (system prompts first, then own by name),
 * without instruction text.
 *
 * `GET {basePath}`
 */
export async function listPrompts(
  client: AxiosInstance,
  basePath: string
): Promise<readonly PromptSummaryResponse[]> {
  const response = await client.get<readonly PromptSummaryResponse[]>(basePath);
  return response.data;
}

/**
 * Get the catalogue grouped by category for the chat `/` picker.
 *
 * `GET {basePath}/picker`
 */
export async function getPromptPicker(
  client: AxiosInstance,
  basePath: string
): Promise<PromptPickerResponse> {
  const response = await client.get<PromptPickerResponse>(`${basePath}/picker`);
  return response.data;
}

/**
 * Get one prompt with its instruction text.
 *
 * `GET {basePath}/{id}`
 */
export async function getPrompt(
  client: AxiosInstance,
  basePath: string,
  id: PromptId
): Promise<PromptResponse> {
  const response = await client.get<PromptResponse>(`${basePath}/${encodeURIComponent(id)}`);
  return response.data;
}

/**
 * Create a private prompt owned by the caller.
 *
 * `POST {basePath}`
 */
export async function createPrompt(
  client: AxiosInstance,
  basePath: string,
  request: CreatePromptRequest
): Promise<PromptResponse> {
  const response = await client.post<PromptResponse>(basePath, request);
  return response.data;
}

/**
 * Update one of the caller's own prompts (bumps its version). System prompts
 * are read-only — the backend reports them as not found (404).
 *
 * `PUT {basePath}/{id}`
 */
export async function updatePrompt(
  client: AxiosInstance,
  basePath: string,
  id: PromptId,
  request: UpdatePromptRequest
): Promise<PromptResponse> {
  const response = await client.put<PromptResponse>(
    `${basePath}/${encodeURIComponent(id)}`,
    request
  );
  return response.data;
}

/**
 * Delete one of the caller's own prompts. System prompts cannot be deleted
 * (404).
 *
 * `DELETE {basePath}/{id}`
 */
export async function deletePrompt(
  client: AxiosInstance,
  basePath: string,
  id: PromptId
): Promise<void> {
  await client.delete(`${basePath}/${encodeURIComponent(id)}`);
}

/**
 * Clone a **system** prompt into a private, editable copy owned by the caller;
 * the original is untouched. A non-system target returns 409.
 *
 * `POST {basePath}/{id}/customise`
 */
export async function customisePrompt(
  client: AxiosInstance,
  basePath: string,
  id: PromptId
): Promise<PromptResponse> {
  const response = await client.post<PromptResponse>(
    `${basePath}/${encodeURIComponent(id)}/customise`
  );
  return response.data;
}
