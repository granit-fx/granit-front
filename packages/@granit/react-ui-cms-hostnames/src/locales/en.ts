// @granit/react-ui-cms-hostnames — i18next resource bundle (flat keys, "translation" ns).
// Keys keep the literal `cms:` prefix (NOT an i18next namespace — the host app runs
// nsSeparator=false, so the prefix is part of the flat key). Register in the host app:
//   import { cmsHostnamesTranslationsEn } from "@granit/react-ui-cms-hostnames";
//   i18n.addResourceBundle("en", "translation", cmsHostnamesTranslationsEn, true, true);

export const cmsHostnamesTranslationsEn = {
  'cms:Hostnames.Actions.Remove': 'Remove',
  'cms:Hostnames.Actions.SetPrimary': 'Set as primary',
  'cms:Hostnames.Actions.VerifyNow': 'Verify now',
  'cms:Hostnames.Add': 'Add hostname',
  'cms:Hostnames.AddError': 'Failed to add hostname.',
  'cms:Hostnames.AddSuccess': 'Hostname added.',
  'cms:Hostnames.Columns.Host': 'Host',
  'cms:Hostnames.Columns.LastVerified': 'Last verified',
  'cms:Hostnames.Columns.Primary': 'Primary',
  'cms:Hostnames.Columns.Status': 'Status',
  'cms:Hostnames.Empty': 'No hostnames configured.',
  'cms:Hostnames.Fields.Host': 'Hostname',
  'cms:Hostnames.Fields.IsPrimary': 'Primary',
  'cms:Hostnames.InvalidHost': 'Invalid hostname format.',
  'cms:Hostnames.LoadError': 'Failed to load hostnames.',
  'cms:Hostnames.Loading': 'Loading hostnames…',
  'cms:Hostnames.PrimaryError': 'Failed to set primary hostname.',
  'cms:Hostnames.PrimarySuccess': '"{{host}}" set as primary.',
  'cms:Hostnames.RemoveConfirm.Description': 'Remove "{{host}}" from this site?',
  'cms:Hostnames.RemoveConfirm.Title': 'Remove hostname?',
  'cms:Hostnames.RemoveError': 'Failed to remove "{{host}}".',
  'cms:Hostnames.RemoveSuccess': 'Hostname removed.',
  'cms:Hostnames.Title': 'Hostnames',
  'cms:Hostnames.VerifyError': 'Failed to trigger verification.',
  'cms:Hostnames.VerifySuccess': 'Verification triggered.',
  'cms:Sites.Title': 'Sites',
} as const;

export type CmsHostnamesTranslations = typeof cmsHostnamesTranslationsEn;
