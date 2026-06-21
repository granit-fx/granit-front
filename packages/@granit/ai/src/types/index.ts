import type { EntityId, ISODateString, TenantId, UserId } from '@granit/types';

// ---------------------------------------------------------------------------
// Types mirroring Granit.AI and Granit.AI.Endpoints .NET contracts.
// Property names match the camelCase JSON serialization from the backend.
// ---------------------------------------------------------------------------

// -- Constants ---------------------------------------------------------------

/** Workspace kind constants. Mirrors `AIWorkspaceKind` enum. */
export const AI_WORKSPACE_KINDS = {
  SYSTEM: 'System',
  DYNAMIC: 'Dynamic',
} as const;

/** Well-known capability extension identifiers. Mirrors `WellKnownAICapabilities`. */
export const AI_CAPABILITY_EXTENSIONS = {
  WEB_SEARCH: 'web-search',
  CODE_INTERPRETER: 'code-interpreter',
  FILE_UPLOAD: 'file-upload',
  FILE_CONTEXT: 'file-context',
  CITATIONS: 'citations',
  STATUS_UPDATES: 'status-updates',
  BUILTIN_TOOLS: 'builtin-tools',
} as const;

/** SSE stream termination marker. */
export const AI_STREAM_DONE_MARKER = '[DONE]';

/** Server-enforced limits for workspace fields. */
export const AI_WORKSPACE_LIMITS = {
  /** `name` maximum length. Pattern: `^[a-z0-9][a-z0-9-]*$`. */
  NAME_MAX_LENGTH: 128,
  /** Slug pattern for workspace names (lowercase alphanumeric + hyphens, no leading hyphen). */
  NAME_PATTERN: /^[a-z0-9][a-z0-9-]*$/,
  /** `workspaceModelName` maximum length (display label). */
  MODEL_NAME_MAX_LENGTH: 64,
} as const;

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
  readonly activated: boolean;
  readonly capabilities: AIModelCapabilities | null;
  /** Human-readable model label (e.g. "GPT-4o"); null if not set. */
  readonly workspaceModelName: string | null;
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
  readonly workspaceModelName?: string | null;
}

/** Update workspace request. Mirrors `AIWorkspaceUpdateRequest`. */
export interface AIWorkspaceUpdateRequest {
  readonly provider: string;
  readonly model: string;
  readonly systemPrompt?: string | null;
  readonly temperature?: number | null;
  readonly maxOutputTokens?: number | null;
  readonly activated: boolean;
  /** Pass null to clear the label. */
  readonly workspaceModelName?: string | null;
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
  readonly estimatedCost: number | null;
  readonly costCurrency: string | null;
}

/** Chat completion response. Mirrors `AIChatResponse`. */
export interface AIChatResponse {
  readonly workspaceName: string;
  readonly model: string;
  /**
   * Generated text. ⚠️ **Untrusted** model output — sanitize and
   * scheme-allowlist any links before rendering as HTML/markdown. Never pass
   * it to a DOM HTML sink unsanitized. See security audit VULN-303.
   */
  readonly content: string;
  readonly usage: AIChatUsageResponse | null;
  readonly duration: string;
}

/** SSE chunk emitted during streaming. */
export interface AIChatStreamChunk {
  readonly content: string;
}

/** Token usage emitted as an SSE `event: usage` before `[DONE]`. */
export interface AIChatStreamUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

/** Discriminated union yielded by {@link chatStream}. */
export type AIChatCompletionEvent =
  | { readonly type: 'chunk'; readonly content: string }
  | { readonly type: 'usage'; readonly usage: AIChatStreamUsage };

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

/** Token usage in an embedding response. Mirrors `AIEmbeddingUsageResponse`. */
export interface AIEmbeddingUsageResponse {
  readonly inputTokens: number;
}

/** Embedding generation response. Mirrors `AIEmbeddingResponse`. */
export interface AIEmbeddingResponse {
  readonly workspaceName: string;
  readonly model: string;
  readonly embeddings: readonly AIEmbeddingDataResponse[];
  readonly usage: AIEmbeddingUsageResponse | null;
}

// -- Providers ---------------------------------------------------------------

/** Model capabilities. Mirrors `Granit.AI.AIModelCapabilities`. */
export interface AIModelCapabilities {
  readonly chat: boolean;
  readonly embeddings: boolean;
  readonly vision: boolean;
  readonly imageGeneration: boolean;
  readonly audio: boolean;
  readonly toolUse: boolean;
  readonly streaming: boolean;
  readonly structuredOutput: boolean;
  readonly extensions: readonly string[];
}

/** Provider summary returned by the discovery endpoint. Mirrors `AIProviderResponse`. */
export interface AIProviderResponse {
  readonly name: string;
  readonly supportsChat: boolean;
  readonly supportsEmbeddings: boolean;
}

/** Model metadata for a given provider. Mirrors `AIProviderModelResponse`. */
export interface AIProviderModelResponse {
  readonly id: string;
  readonly displayName: string;
  readonly capabilities: AIModelCapabilities;
  readonly maxContextTokens: number | null;
}

// -- Usage tracking ----------------------------------------------------------

/** Branded AI usage record identifier. */
export type AIUsageRecordId = EntityId<'AIUsageRecord'>;

/**
 * Branded chat conversation identifier. Defined locally rather than imported
 * from `@granit/ai-chat`: that package depends on `@granit/ai`, so importing
 * back would create a dependency cycle. Brand matches `EntityId<'Conversation'>`
 * used by `@granit/ai-chat`.
 */
export type ConversationId = EntityId<'Conversation'>;

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
  readonly estimatedCost: number | null;
  readonly costCurrency: string | null;
  readonly timestamp: ISODateString;
  readonly duration: string | null;
  readonly conversationId: ConversationId | null;
}
