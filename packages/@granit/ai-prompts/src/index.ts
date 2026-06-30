// Types
export type {
  CategoryId,
  CreatePromptRequest,
  PromptId,
  PromptPickerCategoryResponse,
  PromptPickerItemResponse,
  PromptPickerResponse,
  PromptResponse,
  PromptSummaryResponse,
  UpdatePromptRequest,
} from './types/index';

// Constants
export { GENERAL_CATEGORY_NAME, ICON_COLOR_PATTERN, PROMPT_LIMITS } from './types/index';

// API
export {
  createPrompt,
  customisePrompt,
  deletePrompt,
  getPrompt,
  getPromptPicker,
  listPrompts,
  updatePrompt,
} from './api/prompts-api';

// Permissions
export { AIPromptsPermissions } from './permissions';

// Validation constraints (generated from contracts/openapi/ai-prompts.json)
export { aiPromptsConstraints } from './constraints';
