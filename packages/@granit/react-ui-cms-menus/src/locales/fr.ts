// @granit/react-ui-cms-menus — i18next resource bundle (flat keys, "translation" ns).

import type { CmsMenusTranslations } from './en';

// Same key set as the English bundle (keys enforced via `keyof`), but the values
// are the French strings — so it must NOT be typed as the literal `as const` En type.
export const cmsMenusTranslationsFr: Record<keyof CmsMenusTranslations, string> = {
  'cms:Menus.Columns.Actions': 'Actions',
  'cms:Menus.Columns.Items': 'Éléments',
  'cms:Menus.Columns.Key': 'Clé',
  'cms:Menus.Columns.Title': 'Titre',
  'cms:Menus.CreateError': 'Échec de la création du menu.',
  'cms:Menus.CreateSuccess': 'Menu créé.',
  'cms:Menus.CreateTitle': 'Nouveau menu',
  'cms:Menus.DeleteConfirm.Description': 'Supprimer le menu "{{key}}" ?',
  'cms:Menus.DeleteConfirm.Title': 'Supprimer le menu ?',
  'cms:Menus.DeleteError': 'Échec de la suppression du menu "{{key}}".',
  'cms:Menus.DeleteSuccess': 'Menu supprimé.',
  'cms:Menus.EditTitle': 'Modifier le menu',
  'cms:Menus.Empty': 'Aucun menu trouvé.',
  'cms:Menus.Fields.Items': 'Éléments (JSON)',
  'cms:Menus.Fields.Key': 'Clé',
  'cms:Menus.Fields.Title': 'Titre',
  'cms:Menus.JsonError': 'JSON invalide pour les éléments.',
  'cms:Menus.LoadError': 'Échec du chargement des menus.',
  'cms:Menus.Loading': 'Chargement des menus…',
  'cms:Menus.NewMenu': 'Nouveau menu',
  'cms:Menus.Title': 'Menus',
  'cms:Menus.UpdateError': 'Échec de la mise à jour du menu.',
  'cms:Menus.UpdateSuccess': 'Menu mis à jour.',
};
