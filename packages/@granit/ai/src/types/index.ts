import type { EntityId, ISODateString, TenantId, UserId } from '@granit/types';

// ---------------------------------------------------------------------------
// Types mirroring Granit.AI and Granit.AI.Endpoints .NET contracts.
// Property names match the camelCase JSON serialization from the backend.
// ---------------------------------------------------------------------------

// -- Workspace ---------------------------------------------------------------

/** Workspace kind. Mirrors `Granit.AI.Workspaces.AIWorkspaceKind`. */
export type AIWorkspaceKind = 'System' | 'Dynamic';

/** Workspace configuration returned by the API. Mirrors `AIWorkspaceResponse`. */
export interface AIWorkspaceResponse {
  readonly name: string;
  readonly provider: string;
  readonly model: string;
  readonly systemPrompt: string | null;
  readonly temperature: number | null;
  readonly maxOutputTokens: number | null;
  readonly kind: AIWorkspaceKind;
  readonly isActive: boolean;
}

/** List response wrapper. Mirrors `AIWorkspaceListResponse`. */
export interface AIWorkspaceListResponse {
  readonly workspaces: readonly AIWorkspaceResponse[];
  readonly totalCount: number;
}

/** Create workspace request. Mirrors `AIWorkspaceCreateRequest`. */
export interface AIWorkspaceCreateRequest {
  readonly name: string;
  readonly provider: string;
  readonly model: string;
  readonly systemPrompt?: string | null;
  readonly temperature?: number | null;
  readonly maxOutputTokens?: number | null;
}

/** Update workspace request. Mirrors `AIWorkspaceUpdateRequest`. */
export interface AIWorkspaceUpdateRequest {
  readonly provider: string;
  readonly model: string;
  readonly systemPrompt?: string | null;
  readonly temperature?: number | null;
  readonly maxOutputTokens?: number | null;
  readonly isActive: boolean;
}

// -- Chat completion ---------------------------------------------------------

/** Chat message role. */
export type AIChatMessageRole = 'user' | 'assistant' | 'system';

/** Single message in a chat request. Mirrors `AIChatMessageRequest`. */
export interface AIChatMessageRequest {
  readonly role: AIChatMessageRole;
  readonly content: string;
}

/** Chat completion request. Mirrors `AIChatRequest`. */
export interface AIChatRequest {
  readonly messages: readonly AIChatMessageRequest[];
}

/** Token usage in a chat response. Mirrors `AIChatUsageResponse`. */
export interface AIChatUsageResponse {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly estimatedCostUsd: number | null;
}

/** Chat completion response. Mirrors `AIChatResponse`. */
export interface AIChatResponse {
  readonly workspaceName: string;
  readonly model: string;
  readonly content: string;
  readonly usage: AIChatUsageResponse | null;
  readonly duration: string;
}

/** SSE chunk emitted during streaming. */
export interface AIChatStreamChunk {
  readonly content: string;
}

// -- Embeddings --------------------------------------------------------------

/** Embedding generation request. Mirrors `AIEmbeddingRequest`. */
export interface AIEmbeddingRequest {
  readonly inputs: readonly string[];
}

/** Single embedding vector. Mirrors `AIEmbeddingDataResponse`. */
export interface AIEmbeddingDataResponse {
  readonly index: number;
  readonly vector: readonly number[];
}

/** Embedding generation response. Mirrors `AIEmbeddingResponse`. */
export interface AIEmbeddingResponse {
  readonly workspaceName: string;
  readonly model: string;
  readonly embeddings: readonly AIEmbeddingDataResponse[];
}

// -- Usage tracking ----------------------------------------------------------

/** Branded AI usage record identifier. */
export type AIUsageRecordId = EntityId<'AIUsageRecord'>;

/** AI usage record for querying. Mirrors `Granit.AI.AIUsageRecord`. */
export interface AIUsageRecord {
  readonly id: AIUsageRecordId;
  readonly tenantId: TenantId | null;
  readonly userId: UserId | null;
  readonly workspaceName: string;
  readonly provider: string;
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly estimatedCostUsd: number | null;
  readonly timestamp: ISODateString;
  readonly duration: string | null;
}
