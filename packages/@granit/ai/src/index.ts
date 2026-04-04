// Types
export type {
  AIChatMessageRequest,
  AIChatMessageRole,
  AIChatRequest,
  AIChatResponse,
  AIChatStreamChunk,
  AIChatUsageResponse,
  AIEmbeddingDataResponse,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
  AIUsageRecord,
  AIUsageRecordId,
  AIWorkspaceCreateRequest,
  AIWorkspaceKind,
  AIWorkspaceListResponse,
  AIWorkspaceResponse,
  AIWorkspaceUpdateRequest,
} from './types/index.js';

// Constants
export { AI_PERMISSIONS, AI_STREAM_DONE_MARKER, AI_WORKSPACE_KINDS } from './constants.js';

// API — Workspaces
export {
  createAIWorkspace,
  deleteAIWorkspace,
  fetchAIWorkspace,
  fetchAIWorkspaces,
  updateAIWorkspace,
} from './api/ai-workspaces-api.js';

// API — Chat
export { buildChatStreamUrl, chatComplete, chatStream } from './api/ai-chat-api.js';
export type { ChatStreamOptions } from './api/ai-chat-api.js';

// API — Embeddings
export { generateEmbeddings } from './api/ai-embeddings-api.js';
