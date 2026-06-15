// Provider
export { AIPromptsProvider, useAIPromptsConfig } from './providers/ai-prompts-provider';
export type {
  AIPromptsConfig,
  AIPromptsProviderProps,
  ResolvedAIPromptsConfig,
} from './providers/ai-prompts-provider';

// Query keys
export { promptKeys } from './hooks/query-keys';

// Hooks — queries
export { usePrompts } from './hooks/use-prompts';
export { usePrompt } from './hooks/use-prompt';
export { usePromptPicker } from './hooks/use-prompt-picker';

// Hooks — mutations
export { useCreatePrompt } from './hooks/use-create-prompt';
export type { UseCreatePromptReturn } from './hooks/use-create-prompt';
export { useUpdatePrompt } from './hooks/use-update-prompt';
export type { UpdatePromptVariables, UseUpdatePromptReturn } from './hooks/use-update-prompt';
export { useDeletePrompt } from './hooks/use-delete-prompt';
export type { UseDeletePromptReturn } from './hooks/use-delete-prompt';
export { useCustomisePrompt } from './hooks/use-customise-prompt';
export type { UseCustomisePromptReturn } from './hooks/use-customise-prompt';
