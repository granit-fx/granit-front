// Provider
export { AIProvider, useAIConfig } from './providers/ai-provider';
export type { AIConfig, AIProviderProps, ResolvedAIConfig } from './providers/ai-provider';

// Query keys
export { aiKeys } from './hooks/query-keys';

// Hooks — Providers
export { useAIProviderModels } from './hooks/use-ai-provider-models';
export { useAIProviders } from './hooks/use-ai-providers';

// Hooks — Workspaces
export { useAIWorkspaces } from './hooks/use-ai-workspaces';
export { useAIWorkspace } from './hooks/use-ai-workspace';
export { useCreateAIWorkspace } from './hooks/use-create-ai-workspace';
export type { UseCreateAIWorkspaceReturn } from './hooks/use-create-ai-workspace';
export { useUpdateAIWorkspace } from './hooks/use-update-ai-workspace';
export type { UseUpdateAIWorkspaceReturn } from './hooks/use-update-ai-workspace';
export { useDeleteAIWorkspace } from './hooks/use-delete-ai-workspace';
export type { UseDeleteAIWorkspaceReturn } from './hooks/use-delete-ai-workspace';

// Hooks — Chat
export { useAIChat } from './hooks/use-ai-chat';
export type { UseAIChatReturn } from './hooks/use-ai-chat';
export { useAIChatStream } from './hooks/use-ai-chat-stream';
export type { UseAIChatStreamReturn } from './hooks/use-ai-chat-stream';

// Hooks — Embeddings
export { useAIEmbeddings } from './hooks/use-ai-embeddings';
export type { UseAIEmbeddingsReturn } from './hooks/use-ai-embeddings';
