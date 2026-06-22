// @granit/react-ui-cms-sites — i18next resource bundle (flat keys, "translation" ns).
// Register in the host app:
//   import { cmsSitesTranslationsEn } from "@granit/react-ui-cms-sites";
//   i18n.addResourceBundle("en", "translation", cmsSitesTranslationsEn, true, true);
//
// Keys keep the literal `cms:` prefix (the lookup runs with keySeparator /
// nsSeparator disabled, so these are flat string keys, not namespace traversals).
// This package owns the `cms:Common.*` keys as the CMS module root.

export const cmsSitesTranslationsEn = {
  'cms:Common.Actions': 'Actions',
  'cms:Common.Cancel': 'Cancel',
  'cms:Common.Delete': 'Delete',
  'cms:Common.Disable': 'Disable',
  'cms:Common.Disabled': 'Disabled',
  'cms:Common.Edit': 'Edit',
  'cms:Common.Enable': 'Enable',
  'cms:Common.Enabled': 'Enabled',
  'cms:Common.Loading': 'Loading…',
  'cms:Common.Optional': 'Optional',
  'cms:Common.Remove': 'Remove',
  'cms:Common.Required': 'Required.',
  'cms:Common.Save': 'Save',
  'cms:Common.Saving': 'Saving…',
  'cms:Sites.Actions.Delete': 'Delete',
  'cms:Sites.Actions.Edit': 'Edit',
  'cms:Sites.Actions.Hostnames': 'Hostnames',
  'cms:Sites.Actions.Menus': 'Menus',
  'cms:Sites.Actions.Pages': 'Pages',
  'cms:Sites.Actions.Redirects': 'Redirects',
  'cms:Sites.Actions.Releases': 'Releases',
  'cms:Sites.Actions.Seo': 'SEO',
  'cms:Sites.Columns.Actions': 'Actions',
  'cms:Sites.Columns.Cultures': 'Cultures',
  'cms:Sites.Columns.Name': 'Name',
  'cms:Sites.Columns.Slug': 'Slug',
  'cms:Sites.Columns.Status': 'Status',
  'cms:Sites.CreateError': 'Failed to create site.',
  'cms:Sites.CreateSuccess': 'Site created.',
  'cms:Sites.CreateTitle': 'New site',
  'cms:Sites.DeleteConfirm.Description':
    'This will permanently delete "{{slug}}" and all its content.',
  'cms:Sites.DeleteConfirm.Title': 'Delete site?',
  'cms:Sites.DeleteError': 'Failed to delete site "{{slug}}".',
  'cms:Sites.DeleteSuccess': 'Site deleted.',
  'cms:Sites.EditTitle': 'Edit site',
  'cms:Sites.Empty': 'No sites found.',
  'cms:Sites.Fields.Activated': 'Activated',
  'cms:Sites.Fields.AllowedCultures': 'Allowed cultures',
  'cms:Sites.Fields.AllowedCulturesHint': 'Comma-separated list of culture codes.',
  'cms:Sites.Fields.DefaultCulture': 'Default culture',
  'cms:Sites.Fields.DefaultTheme': 'Default theme',
  'cms:Sites.Fields.Slug': 'Slug',
  'cms:Sites.LoadError': 'Failed to load sites.',
  'cms:Sites.Loading': 'Loading sites…',
  'cms:Sites.NewSite': 'New site',
  'cms:Sites.Status.Active': 'Active',
  'cms:Sites.Status.Inactive': 'Inactive',
  'cms:Sites.Subtitle': 'Manage your CMS sites and their content.',
  'cms:Sites.Title': 'Sites',
  'cms:Sites.UpdateError': 'Failed to update site.',
  'cms:Sites.UpdateSuccess': 'Site updated.',
} as const;

export type CmsSitesTranslations = typeof cmsSitesTranslationsEn;
