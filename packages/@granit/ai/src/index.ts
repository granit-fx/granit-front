// Types & Constants
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
  ChatStreamEvent,
} from './types/index';
export {
  AI_CAPABILITY_EXTENSIONS,
  AI_PERMISSIONS,
  AI_STREAM_DONE_MARKER,
  AI_WORKSPACE_KINDS,
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
