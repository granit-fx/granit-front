// Types
export type {
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
} from './types/index.js';

// Constants
export {
  AI_CAPABILITY_EXTENSIONS,
  AI_PERMISSIONS,
  AI_STREAM_DONE_MARKER,
  AI_WORKSPACE_KINDS,
} from './constants.js';

// API — Providers
export { listAIProviderModels, listAIProviders } from './api/ai-providers-api.js';

// API — Workspaces
export {
  createAIWorkspace,
  deleteAIWorkspace,
  getAIWorkspace,
  listAIWorkspaces,
  updateAIWorkspace,
} from './api/ai-workspaces-api.js';

// API — Chat
export { chatComplete, chatStream } from './api/ai-chat-api.js';
export type { ChatStreamEvent } from './api/ai-chat-api.js';

// API — Embeddings
export { generateEmbeddings } from './api/ai-embeddings-api.js';
