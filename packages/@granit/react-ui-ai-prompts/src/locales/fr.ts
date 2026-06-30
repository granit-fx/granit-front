/**
 * French admin strings for the AI Prompts UI. Flat `AiPrompts.*` keys in the
 * `translation` namespace (the host registers them with separators disabled, so
 * the dotted keys are looked up verbatim). Named with the `Admin` infix because
 * the headless `@granit/react-ai-prompts` already exports
 * `aiPromptsTranslationsEn/Fr`. This is the single bundle owning every
 * user-facing string of the catalogue page, form, catalogue list, picker and
 * icon picker — the styled components consume these via `useTranslation`.
 */
export const aiPromptsAdminTranslationsFr = {
  'AiPrompts.Actions.Cancel': 'Annuler',
  'AiPrompts.Actions.Delete': 'Supprimer',
  'AiPrompts.Catalogue.Customise': 'Personnaliser',
  'AiPrompts.Catalogue.DescriptionAfter':
    ' réutilisables dans le chat. Les prompts système sont en lecture seule — personnalisez-en un pour obtenir une copie modifiable.',
  'AiPrompts.Catalogue.DescriptionBefore': 'Prompts ',
  'AiPrompts.Catalogue.Edit': 'Modifier',
  'AiPrompts.Catalogue.Delete': 'Supprimer',
  'AiPrompts.Catalogue.Empty': 'Aucun prompt pour l’instant.',
  'AiPrompts.Catalogue.New': 'Nouveau prompt',
  'AiPrompts.Catalogue.System': 'Système',
  'AiPrompts.Catalogue.Title': 'Catalogue de prompts',
  'AiPrompts.Delete.ConfirmDescription': 'Cette action est irréversible.',
  'AiPrompts.Delete.ConfirmTitle': 'Supprimer ce prompt ?',
  'AiPrompts.Form.Cancel': 'Annuler',
  'AiPrompts.Form.Content': 'Instruction',
  'AiPrompts.Form.ContentPlaceholder': 'Que doit faire l’assistant ?',
  'AiPrompts.Form.EditTitle': 'Modifier le prompt',
  'AiPrompts.Form.Icon': 'Icône',
  'AiPrompts.Form.Loading': 'Chargement…',
  'AiPrompts.Form.Name': 'Nom',
  'AiPrompts.Form.NamePlaceholder': 'ex. Résumer',
  'AiPrompts.Form.NewTitle': 'Nouveau prompt',
  'AiPrompts.Form.Save': 'Enregistrer',
  'AiPrompts.Form.ShortDescription': 'Description courte',
  'AiPrompts.IconPicker.ColorHexLabel': 'Couleur de l’icône (hex)',
  'AiPrompts.IconPicker.ColorInvalid': 'Utilisez #RRGGBB ou #RRGGBBAA.',
  'AiPrompts.IconPicker.ColorLabel': 'Couleur de l’icône',
  'AiPrompts.IconPicker.IconLabel': 'Icône',
  'AiPrompts.Picker.NoResults': 'Aucun prompt',
  'AiPrompts.Picker.System': 'Système',
  'AiPrompts.Picker.Title': 'Prompts',
} as const;
