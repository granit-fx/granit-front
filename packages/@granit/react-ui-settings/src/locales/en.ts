// @granit/react-ui-settings — i18next resource bundle (flat keys, "translation" ns).
// Register in the host app:
//   import { settingsTranslationsEn } from "@granit/react-ui-settings";
//   i18n.addResourceBundle("en", "translation", settingsTranslationsEn, true, true);

export const settingsTranslationsEn = {
  'Config.AppSettings.ChangeSecret': 'Change',
  'Config.AppSettings.ConfirmReset': 'Reset all settings to defaults?',
  'Config.AppSettings.NoChanges': 'No changes to save',
  'Config.AppSettings.SaveError': 'Failed to save settings',
  'Config.AppSettings.SaveErrorRow': 'Failed to save {{key}}',
  'Config.AppSettings.SaveSuccess': 'Settings saved successfully',
  'Config.AppSettings.Subtitle': 'Core configuration parameters',
  'Config.AppSettings.Title': 'Application Settings',
  'Config.AppSettings.UnsavedChanges': 'You have unsaved changes',
} as const;

export type SettingsTranslations = typeof settingsTranslationsEn;
