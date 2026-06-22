// @granit/react-ui-features — i18next resource bundle (flat keys, "translation" ns).
// Register in the host app:
//   import { featuresTranslationsEn } from "@granit/react-ui-features";
//   i18n.addResourceBundle("en", "translation", featuresTranslationsEn, true, true);

export const featuresTranslationsEn = {
  'Features.Detail.AllowedValues': 'Allowed Values',
  'Features.Detail.BackToList': 'Back to list',
  'Features.Detail.CurrentState': 'Current State',
  'Features.Detail.CurrentValue': 'Current Value',
  'Features.Detail.DefaultValue': 'Default Value',
  'Features.Detail.Definition': 'Definition',
  'Features.Detail.Name': 'Name',
  'Features.Detail.NotFound': 'Feature not found',
  'Features.Detail.Range': 'Range',
  'Features.Detail.Type': 'Type',
  'Features.Group.Count': '{{count}} features',
  'Features.List.Description': 'Manage feature flags and overrides',
  'Features.List.Empty': 'No feature flags found',
  'Features.List.Title': 'Feature Flags',
  'Features.Override.Configure': 'Configure override',
  'Features.Override.NumericRange': 'Numeric range',
  'Features.Override.Remove': 'Remove override',
  'Features.Override.RemoveError': 'Failed to remove override',
  'Features.Override.RemoveSuccess': 'Override removed successfully',
  'Features.Override.Save': 'Save',
  'Features.Override.SetError': 'Failed to set override',
  'Features.Override.SetSuccess': 'Override set successfully',
  'Features.Override.Title': 'Override',
  'Features.Override.Value': 'Value',
  'Features.Type.Numeric': 'Numeric',
  'Features.Type.Selection': 'Selection',
  'Features.Type.Toggle': 'Toggle',
  'Features.Value.Disabled': 'Disabled',
  'Features.Value.Enabled': 'Enabled',
} as const;

export type FeaturesTranslations = typeof featuresTranslationsEn;
