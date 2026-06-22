// @granit/react-ui-cms-hostnames — French resource bundle (flat keys, "translation" ns).

import type { CmsHostnamesTranslations } from './en';

export const cmsHostnamesTranslationsFr: Record<keyof CmsHostnamesTranslations, string> = {
  'cms:Hostnames.Actions.Remove': 'Supprimer',
  'cms:Hostnames.Actions.SetPrimary': 'Définir comme principal',
  'cms:Hostnames.Actions.VerifyNow': 'Vérifier maintenant',
  'cms:Hostnames.Add': "Ajouter un nom d'hôte",
  'cms:Hostnames.AddError': "Échec de l'ajout du nom d'hôte.",
  'cms:Hostnames.AddSuccess': "Nom d'hôte ajouté.",
  'cms:Hostnames.Columns.Host': 'Hôte',
  'cms:Hostnames.Columns.LastVerified': 'Dernière vérification',
  'cms:Hostnames.Columns.Primary': 'Principal',
  'cms:Hostnames.Columns.Status': 'Statut',
  'cms:Hostnames.Empty': "Aucun nom d'hôte configuré.",
  'cms:Hostnames.Fields.Host': "Nom d'hôte",
  'cms:Hostnames.Fields.IsPrimary': 'Principal',
  'cms:Hostnames.InvalidHost': "Format de nom d'hôte invalide.",
  'cms:Hostnames.LoadError': "Échec du chargement des noms d'hôte.",
  'cms:Hostnames.Loading': "Chargement des noms d'hôte…",
  'cms:Hostnames.PrimaryError': "Échec de la définition du nom d'hôte principal.",
  'cms:Hostnames.PrimarySuccess': '"{{host}}" défini comme principal.',
  'cms:Hostnames.RemoveConfirm.Description': 'Supprimer "{{host}}" de ce site ?',
  'cms:Hostnames.RemoveConfirm.Title': "Supprimer le nom d'hôte ?",
  'cms:Hostnames.RemoveError': 'Échec de la suppression de "{{host}}".',
  'cms:Hostnames.RemoveSuccess': "Nom d'hôte supprimé.",
  'cms:Hostnames.Title': "Noms d'hôte",
  'cms:Hostnames.VerifyError': 'Échec du déclenchement de la vérification.',
  'cms:Hostnames.VerifySuccess': 'Vérification déclenchée.',
  'cms:Sites.Title': 'Sites',
};
