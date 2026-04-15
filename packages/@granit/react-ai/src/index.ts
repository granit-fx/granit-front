// Provider
export { AIProvider, buildAIQueryKey, useAIConfig } from './providers/ai-provider.js';
export type { AIConfig, AIProviderProps } from './providers/ai-provider.js';

// Hooks — Providers
export { useAIProviderModels } from './hooks/use-ai-provider-models.js';
export { useAIProviders } from './hooks/use-ai-providers.js';

// Hooks — Workspaces
export { useAIWorkspaces } from './hooks/use-ai-workspaces.js';
export { useAIWorkspace } from './hooks/use-ai-workspace.js';
export { useCreateAIWorkspace } from './hooks/use-create-ai-workspace.js';
export type { UseCreateAIWorkspaceReturn } from './hooks/use-create-ai-workspace.js';
export { useUpdateAIWorkspace } from './hooks/use-update-ai-workspace.js';
export type { UseUpdateAIWorkspaceReturn } from './hooks/use-update-ai-workspace.js';
export { useDeleteAIWorkspace } from './hooks/use-delete-ai-workspace.js';
export type { UseDeleteAIWorkspaceReturn } from './hooks/use-delete-ai-workspace.js';

// Hooks — Chat
export { useAIChat } from './hooks/use-ai-chat.js';
export type { UseAIChatReturn } from './hooks/use-ai-chat.js';
export { useAIChatStream } from './hooks/use-ai-chat-stream.js';
export type { UseAIChatStreamReturn } from './hooks/use-ai-chat-stream.js';

// Hooks — Embeddings
export { useAIEmbeddings } from './hooks/use-ai-embeddings.js';
export type { UseAIEmbeddingsReturn } from './hooks/use-ai-embeddings.js';
