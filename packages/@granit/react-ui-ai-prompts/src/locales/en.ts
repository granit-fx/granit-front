/**
 * English admin strings for the AI Prompts UI. Flat `AiPrompts.*` keys in the
 * `translation` namespace (the host registers them with separators disabled, so
 * the dotted keys are looked up verbatim). Named with the `Admin` infix because
 * the headless `@granit/react-ai-prompts` already exports
 * `aiPromptsTranslationsEn/Fr`. This is the single bundle owning every
 * user-facing string of the catalogue page, form, catalogue list, picker and
 * icon picker — the styled components consume these via `useTranslation`.
 */
export const aiPromptsAdminTranslationsEn = {
  'AiPrompts.Actions.Cancel': 'Cancel',
  'AiPrompts.Actions.Delete': 'Delete',
  'AiPrompts.Catalogue.Customise': 'Customise',
  'AiPrompts.Catalogue.DescriptionAfter':
    ' prompts for the chat. System prompts are read-only — customise one to get an editable copy.',
  'AiPrompts.Catalogue.DescriptionBefore': 'Reusable ',
  'AiPrompts.Catalogue.Edit': 'Edit',
  'AiPrompts.Catalogue.Delete': 'Delete',
  'AiPrompts.Catalogue.Empty': 'No prompts yet.',
  'AiPrompts.Catalogue.New': 'New prompt',
  'AiPrompts.Catalogue.System': 'System',
  'AiPrompts.Catalogue.Title': 'Prompt catalogue',
  'AiPrompts.Delete.ConfirmDescription': 'This cannot be undone.',
  'AiPrompts.Delete.ConfirmTitle': 'Delete this prompt?',
  'AiPrompts.Form.Cancel': 'Cancel',
  'AiPrompts.Form.Content': 'Instruction',
  'AiPrompts.Form.ContentPlaceholder': 'What should the assistant do?',
  'AiPrompts.Form.EditTitle': 'Edit prompt',
  'AiPrompts.Form.Icon': 'Icon',
  'AiPrompts.Form.Loading': 'Loading…',
  'AiPrompts.Form.Name': 'Name',
  'AiPrompts.Form.NamePlaceholder': 'e.g. Summarize',
  'AiPrompts.Form.NewTitle': 'New prompt',
  'AiPrompts.Form.Save': 'Save',
  'AiPrompts.Form.ShortDescription': 'Short description',
  'AiPrompts.IconPicker.ColorHexLabel': 'Icon colour hex',
  'AiPrompts.IconPicker.ColorInvalid': 'Use #RRGGBB or #RRGGBBAA.',
  'AiPrompts.IconPicker.ColorLabel': 'Icon colour',
  'AiPrompts.IconPicker.IconLabel': 'Icon',
  'AiPrompts.Picker.NoResults': 'No prompts',
  'AiPrompts.Picker.System': 'System',
  'AiPrompts.Picker.Title': 'Prompts',
} as const;
