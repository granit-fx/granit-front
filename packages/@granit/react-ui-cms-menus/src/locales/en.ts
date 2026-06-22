// @granit/react-ui-cms-menus — i18next resource bundle (flat keys, "translation" ns).
// Keys keep the literal `cms:` prefix (the host registers them verbatim; with
// nsSeparator:false they are NOT resolved as an i18next namespace).
// Register in the host app:
//   import { cmsMenusTranslationsEn } from "@granit/react-ui-cms-menus";
//   i18n.addResourceBundle("en", "translation", cmsMenusTranslationsEn, true, true);

export const cmsMenusTranslationsEn = {
  'cms:Menus.Columns.Actions': 'Actions',
  'cms:Menus.Columns.Items': 'Items',
  'cms:Menus.Columns.Key': 'Key',
  'cms:Menus.Columns.Title': 'Title',
  'cms:Menus.CreateError': 'Failed to create menu.',
  'cms:Menus.CreateSuccess': 'Menu created.',
  'cms:Menus.CreateTitle': 'New menu',
  'cms:Menus.DeleteConfirm.Description': 'Delete menu "{{key}}"?',
  'cms:Menus.DeleteConfirm.Title': 'Delete menu?',
  'cms:Menus.DeleteError': 'Failed to delete menu "{{key}}".',
  'cms:Menus.DeleteSuccess': 'Menu deleted.',
  'cms:Menus.EditTitle': 'Edit menu',
  'cms:Menus.Empty': 'No menus found.',
  'cms:Menus.Fields.Items': 'Items (JSON)',
  'cms:Menus.Fields.Key': 'Key',
  'cms:Menus.Fields.Title': 'Title',
  'cms:Menus.JsonError': 'Invalid JSON for items.',
  'cms:Menus.LoadError': 'Failed to load menus.',
  'cms:Menus.Loading': 'Loading menus…',
  'cms:Menus.NewMenu': 'New menu',
  'cms:Menus.Title': 'Menus',
  'cms:Menus.UpdateError': 'Failed to update menu.',
  'cms:Menus.UpdateSuccess': 'Menu updated.',
} as const;

export type CmsMenusTranslations = typeof cmsMenusTranslationsEn;
