/**
 * English admin strings for the AI Prompts UI. Flat `AiPrompts.*` keys in the
 * `translation` namespace (the host registers them with separators disabled, so
 * the dotted keys are looked up verbatim). Named with the `Admin` infix because
 * the headless `@granit/react-ai-prompts` already exports
 * `aiPromptsTranslationsEn/Fr`.
 */
export const aiPromptsAdminTranslationsEn = {
  'AiPrompts.Actions.Cancel': 'Cancel',
  'AiPrompts.Actions.Delete': 'Delete',
  'AiPrompts.Catalogue.DescriptionAfter':
    ' prompts for the chat. System prompts are read-only — customise one to get an editable copy.',
  'AiPrompts.Catalogue.DescriptionBefore': 'Reusable ',
  'AiPrompts.Catalogue.Title': 'Prompt catalogue',
  'AiPrompts.Delete.ConfirmDescription': 'This cannot be undone.',
  'AiPrompts.Delete.ConfirmTitle': 'Delete this prompt?',
  'AiPrompts.Form.EditTitle': 'Edit prompt',
  'AiPrompts.Form.Loading': 'Loading…',
  'AiPrompts.Form.NewTitle': 'New prompt',
} as const;
