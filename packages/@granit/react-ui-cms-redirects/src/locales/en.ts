// @granit/react-ui-cms-redirects — i18next resource bundle (flat keys, "translation" ns).
// Register in the host app:
//   import { cmsRedirectsTranslationsEn } from "@granit/react-ui-cms-redirects";
//   i18n.addResourceBundle("en", "translation", cmsRedirectsTranslationsEn, true, true);
//
// Keys keep their literal `cms:` prefix (NOT an i18next namespace — the host runs
// with nsSeparator=false, so `cms:Redirects.Title` is a flat exact-match key).
// `cms:Common.*`, `cms:Sites.*`, and the `cms:Redirects.MatchType/Type.*` enum
// labels are owned by the host CMS bundle; the components carry inline defaults so
// they render even when only this bundle is registered.

export const cmsRedirectsTranslationsEn = {
  'cms:Redirects.Columns.Active': 'Active',
  'cms:Redirects.Columns.Culture': 'Culture',
  'cms:Redirects.Columns.Enabled': 'Enabled',
  'cms:Redirects.Columns.From': 'From',
  'cms:Redirects.Columns.Hits': 'Hits',
  'cms:Redirects.Columns.MatchType': 'Match',
  'cms:Redirects.Columns.Source': 'Source',
  'cms:Redirects.Columns.StatusCode': 'Code',
  'cms:Redirects.Columns.Target': 'Target',
  'cms:Redirects.Columns.To': 'To',
  'cms:Redirects.Columns.Type': 'Type',
  'cms:Redirects.CreateError': 'Failed to create redirect.',
  'cms:Redirects.CreateSuccess': 'Redirect created.',
  'cms:Redirects.CreateTitle': 'New redirect',
  'cms:Redirects.DeleteConfirm.Description': 'Delete redirect from "{{path}}"?',
  'cms:Redirects.DeleteConfirm.Title': 'Delete redirect?',
  'cms:Redirects.DeleteError': 'Failed to delete redirect "{{path}}".',
  'cms:Redirects.DeleteSuccess': 'Redirect deleted.',
  'cms:Redirects.EditTitle': 'Edit redirect',
  'cms:Redirects.Empty': 'No redirects found.',
  'cms:Redirects.Fields.Culture': 'Culture',
  'cms:Redirects.Fields.From': 'From path',
  'cms:Redirects.Fields.MatchType': 'Match type',
  'cms:Redirects.Fields.Source': 'Source path',
  'cms:Redirects.Fields.SourceImmutable': 'The source path cannot be changed after creation.',
  'cms:Redirects.Fields.StatusCode': 'Status code',
  'cms:Redirects.Fields.Target': 'Target path',
  'cms:Redirects.Fields.To': 'To path',
  'cms:Redirects.Fields.Type': 'Redirect type',
  'cms:Redirects.FormDescription': 'Map a source path to a destination path.',
  'cms:Redirects.LoadError': 'Failed to load redirects.',
  'cms:Redirects.Loading': 'Loading redirects…',
  'cms:Redirects.NewRedirect': 'New redirect',
  'cms:Redirects.Title': 'Redirects',
  'cms:Redirects.ToggleError': 'Failed to update redirect.',
  'cms:Redirects.ToggleSuccess': 'Redirect updated.',
  'cms:Redirects.UpdateError': 'Failed to update redirect.',
  'cms:Redirects.UpdateSuccess': 'Redirect updated.',
  'cms:Sites.Title': 'Sites',
} as const;

export type CmsRedirectsTranslations = typeof cmsRedirectsTranslationsEn;
