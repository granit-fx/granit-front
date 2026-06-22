// @granit/react-ui-cms-pages — i18next resource bundle (flat keys, "translation" ns).
// French counterpart of cmsPagesTranslationsEn. No type annotation (per convention)
// so a missing key surfaces as a structural mismatch against CmsPagesTranslations.

export const cmsPagesTranslationsFr = {
  'cms:Pages.Columns.Actions': 'Actions',
  'cms:Pages.Columns.Depth': 'Profondeur',
  'cms:Pages.Columns.Path': 'Chemin',
  'cms:Pages.Content.Description': 'Modifier le contenu structuré de cette page.',
  'cms:Pages.Content.EditContent': 'Modifier le contenu',
  'cms:Pages.Content.NoRenderer': 'Éditeur de contenu indisponible.',
  'cms:Pages.Content.Title': 'Contenu de la page',
  'cms:Pages.CreateSuccess': 'Page créée.',
  'cms:Pages.CreateTitle': 'Nouvelle page',
  'cms:Pages.DeleteConfirm.Description': 'Supprimer "{{path}}" et tous ses enfants ?',
  'cms:Pages.DeleteConfirm.Title': 'Supprimer la page ?',
  'cms:Pages.DeleteError': 'Échec de la suppression de "{{path}}".',
  'cms:Pages.DeleteSuccess': 'Page supprimée.',
  'cms:Pages.EditTitle': 'Modifier la page',
  'cms:Pages.Empty': 'Aucune page trouvée.',
  'cms:Pages.Fields.Layout': 'Clé de mise en page',
  'cms:Pages.Fields.Parent': 'Page parente',
  'cms:Pages.Fields.ParentHint': 'La nouvelle page est imbriquée sous cette page.',
  'cms:Pages.Fields.ParentPlaceholder': 'Sélectionner un parent',
  'cms:Pages.Fields.Slug': "Segment d'URL",
  'cms:Pages.Fields.SlugHint': 'Lettres minuscules, chiffres et tirets uniquement (ex. : ma-page).',
  'cms:Pages.Fields.SlugInvalid':
    'Lettres minuscules, chiffres et tirets uniquement (ex. : ma-page).',
  'cms:Pages.Fields.SlugRootHint': 'Le chemin de la page racine ne peut pas être renommé.',
  'cms:Pages.LoadError': 'Échec du chargement des pages.',
  'cms:Pages.Loading': 'Chargement des pages…',
  'cms:Pages.NewPage': 'Nouvelle page',
  'cms:Pages.NoRootPage': 'Aucune page racine pour le moment.',
  'cms:Pages.RootLabel': '/ (racine du site)',
  'cms:Pages.Title': 'Pages',
  'cms:Pages.UpdateSuccess': 'Page mise à jour.',
  'cms:Sites.Title': 'Sites',
} as const;
