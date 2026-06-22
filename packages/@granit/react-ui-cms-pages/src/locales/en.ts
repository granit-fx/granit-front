// @granit/react-ui-cms-pages — i18next resource bundle (flat keys, "translation" ns).
// Keys keep the literal `cms:` prefix (NOT an i18next namespace — the host runs
// i18next with nsSeparator/keySeparator = false, so these are exact-match flat keys).
// Register in the host app:
//   import { cmsPagesTranslationsEn } from "@granit/react-ui-cms-pages";
//   i18n.addResourceBundle("en", "translation", cmsPagesTranslationsEn, true, true);

export const cmsPagesTranslationsEn = {
  'cms:Pages.Columns.Actions': 'Actions',
  'cms:Pages.Columns.Depth': 'Depth',
  'cms:Pages.Columns.Path': 'Path',
  'cms:Pages.Content.Description': 'Edit the structured content of this page.',
  'cms:Pages.Content.EditContent': 'Edit content',
  'cms:Pages.Content.NoRenderer': 'Content editor unavailable.',
  'cms:Pages.Content.Title': 'Page content',
  'cms:Pages.CreateSuccess': 'Page created.',
  'cms:Pages.CreateTitle': 'New page',
  'cms:Pages.DeleteConfirm.Description': 'Delete "{{path}}" and all its children?',
  'cms:Pages.DeleteConfirm.Title': 'Delete page?',
  'cms:Pages.DeleteError': 'Failed to delete "{{path}}".',
  'cms:Pages.DeleteSuccess': 'Page deleted.',
  'cms:Pages.EditTitle': 'Edit page',
  'cms:Pages.Empty': 'No pages found.',
  'cms:Pages.Fields.Layout': 'Layout key',
  'cms:Pages.Fields.Parent': 'Parent page',
  'cms:Pages.Fields.ParentHint': 'The new page is nested under this page.',
  'cms:Pages.Fields.ParentPlaceholder': 'Select a parent',
  'cms:Pages.Fields.Slug': 'Slug segment',
  'cms:Pages.Fields.SlugHint': 'Lowercase letters, digits and hyphens only (e.g. my-page).',
  'cms:Pages.Fields.SlugInvalid': 'Lowercase letters, digits and hyphens only (e.g. my-page).',
  'cms:Pages.Fields.SlugRootHint': 'The site root path cannot be renamed.',
  'cms:Pages.LoadError': 'Failed to load pages.',
  'cms:Pages.Loading': 'Loading pages…',
  'cms:Pages.NewPage': 'New page',
  'cms:Pages.NoRootPage': 'No root page yet.',
  'cms:Pages.RootLabel': '/ (site root)',
  'cms:Pages.Title': 'Pages',
  'cms:Pages.UpdateSuccess': 'Page updated.',
  'cms:Sites.Title': 'Sites',
} as const;

export type CmsPagesTranslations = typeof cmsPagesTranslationsEn;
