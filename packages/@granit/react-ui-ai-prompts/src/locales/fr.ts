/**
 * French admin strings for the AI Prompts UI. Flat `AiPrompts.*` keys in the
 * `translation` namespace (the host registers them with separators disabled, so
 * the dotted keys are looked up verbatim). Named with the `Admin` infix because
 * the headless `@granit/react-ai-prompts` already exports
 * `aiPromptsTranslationsEn/Fr`.
 */
export const aiPromptsAdminTranslationsFr = {
  'AiPrompts.Actions.Cancel': 'Annuler',
  'AiPrompts.Actions.Delete': 'Supprimer',
  'AiPrompts.Catalogue.DescriptionAfter':
    ' réutilisables dans le chat. Les prompts système sont en lecture seule — personnalisez-en un pour obtenir une copie modifiable.',
  'AiPrompts.Catalogue.DescriptionBefore': 'Prompts ',
  'AiPrompts.Catalogue.Title': 'Catalogue de prompts',
  'AiPrompts.Delete.ConfirmDescription': 'Cette action est irréversible.',
  'AiPrompts.Delete.ConfirmTitle': 'Supprimer ce prompt ?',
  'AiPrompts.Form.EditTitle': 'Modifier le prompt',
  'AiPrompts.Form.Loading': 'Chargement…',
  'AiPrompts.Form.NewTitle': 'Nouveau prompt',
} as const;
