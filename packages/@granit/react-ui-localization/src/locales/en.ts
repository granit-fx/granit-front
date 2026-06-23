/**
 * English admin strings for the Localization UI. Flat `Localization.*` keys in
 * the `translation` namespace (the host registers them with separators
 * disabled, so the dotted keys are looked up verbatim). Named with the
 * `localizationAdmin` prefix to avoid colliding with the headless
 * `@granit/react-localization` exports.
 */
export const localizationAdminTranslationsEn = {
  'Localization.Actions.CreateOverride': 'Add override',
  'Localization.Actions.DeleteOverride': 'Delete override',
  'Localization.Columns.CultureName': 'Language',
  'Localization.Columns.Key': 'Key',
  'Localization.Columns.ModifiedAt': 'Modified at',
  'Localization.Columns.ModifiedBy': 'Modified by',
  'Localization.Columns.ResourceName': 'Module',
  'Localization.Columns.Value': 'Value',
  'Localization.CreateDialog.Description':
    'Override a translation for a specific module, language, and key.',
  'Localization.CreateDialog.Title': 'Add translation override',
  'Localization.DeleteDialog.Message':
    'Are you sure you want to delete the override for key "{{key}}" ({{culture}})? The translation will revert to its default value.',
  'Localization.DeleteDialog.Title': 'Delete override',
  'Localization.DeleteError': 'Failed to delete override',
  'Localization.DeleteSuccess': 'Override deleted successfully',
  'Localization.EditDialog.Description': 'Edit the override value for this translation key.',
  'Localization.EditDialog.Title': 'Edit translation',
  'Localization.EditDialog.Value': 'Override value',
  'Localization.EditDialog.ValueRequired': 'Value is required',
  'Localization.Languages.Default': 'Default',
  'Localization.Languages.Subtitle': 'Languages available in the application',
  'Localization.Languages.Title': 'Languages',
  'Localization.SaveError': 'Failed to update translation',
  'Localization.SaveSuccess': 'Translation updated successfully',
  'Localization.Subtitle': 'Manage translation overrides by module and language',
  'Localization.Title': 'Localization Management',
} as const;
