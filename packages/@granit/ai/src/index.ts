// Types & Constants
export type {
  AIChatCompletionEvent,
  AIChatMessageRequest,
  AIChatMessageRole,
  AIChatRequest,
  AIChatResponse,
  AIChatStreamChunk,
  AIChatStreamUsage,
  AIChatUsageResponse,
  AIEmbeddingDataResponse,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
  AIEmbeddingUsageResponse,
  AIModelCapabilities,
  AIProviderModelResponse,
  AIProviderResponse,
  AIUsageRecord,
  AIUsageRecordId,
  AIWorkspaceCreateRequest,
  AIWorkspaceKind,
  AIWorkspaceListResponse,
  AIWorkspaceResponse,
  AIWorkspaceUpdateRequest,
  ConversationId,
} from './types/index';
export {
  AI_CAPABILITY_EXTENSIONS,
  AI_STREAM_DONE_MARKER,
  AI_WORKSPACE_KINDS,
  AI_WORKSPACE_LIMITS,
} from './types/index';

// API — Providers
export { listAIProviderModels, listAIProviders } from './api/ai-providers-api';

// API — Workspaces
export {
  createAIWorkspace,
  deleteAIWorkspace,
  getAIWorkspace,
  listAIWorkspaces,
  updateAIWorkspace,
} from './api/ai-workspaces-api';

// API — Chat
export { chatComplete, chatStream } from './api/ai-chat-api';

// API — Embeddings
export { generateEmbeddings } from './api/ai-embeddings-api';
export { AIPermissions } from './permissions';

// Validation constraints (generated from contracts/openapi/ai.json)
export { aiConstraints } from './constraints';
