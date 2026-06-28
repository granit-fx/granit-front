// @granit/react-ui-dashboards — i18next resource bundle (flat keys, "translation" ns), French.

export const dashboardsTranslationsFr = {
  'Dashboards.Edit.AddWidget': 'Ajouter un widget',
  'Dashboards.Edit.AddWidget.Body':
    'Choisissez un type de widget à déposer sur le dashboard. Vous pourrez le configurer une fois posé sur la grille.',
  'Dashboards.Edit.AddWidget.Title': 'Ajouter un widget',
  'Dashboards.Edit.Confirm.Discard.Body':
    'Les modifications locales seront annulées et la dernière version enregistrée sera restaurée. Cette action est irréversible.',
  'Dashboards.Edit.Confirm.Discard.Title': 'Annuler les modifications non enregistrées ?',
  'Dashboards.Edit.Confirm.RemoveWidget.Body':
    "« {{slug}} » sera retiré de la copie de travail. La suppression sera persistée à l'enregistrement.",
  'Dashboards.Edit.Confirm.RemoveWidget.Title': 'Retirer le widget ?',
  'Dashboards.Edit.EditWidget.Title': 'Modifier le widget — {{slug}}',
  'Dashboards.Edit.IncompleteWidgets_one': '{{count}} widget requiert des champs obligatoires',
  'Dashboards.Edit.IncompleteWidgets_other': '{{count}} widgets requièrent des champs obligatoires',
  'Dashboards.Edit.MissingRequired': 'Obligatoire :',
  'Dashboards.Edit.SaveError':
    "Impossible d'enregistrer le dashboard. Certaines modifications ont peut-être été persistées.",
  'Dashboards.Edit.SaveSuccess': 'Dashboard enregistré',
  'Dashboards.Edit.SelectAWidget': 'Sélectionnez un widget pour modifier sa configuration.',
  'Dashboards.List.CatalogCategoryFilter.All': 'Toutes les catégories',
  'Dashboards.List.Confirm.Archive.Body':
    '« {{name}} » sera masqué pour les locataires. Les références existantes restent intactes et vous pourrez le restaurer depuis le filtre Archivés.',
  'Dashboards.List.Confirm.Archive.Title': 'Archiver le dashboard ?',
  'Dashboards.List.Confirm.Publish.Body':
    "« {{name}} » deviendra visible pour les locataires assignés à ce dashboard. Vous pourrez l'archiver à nouveau plus tard.",
  'Dashboards.List.Confirm.Publish.Title': 'Publier le dashboard ?',
  'Dashboards.List.Confirm.Restore.Body':
    "« {{name}} » repassera en statut Brouillon. Publiez-le à nouveau pour l'exposer aux locataires.",
  'Dashboards.List.Confirm.Restore.Title': 'Restaurer le dashboard ?',
  'Dashboards.List.Confirm.Resync.Body':
    '« {{name}} » sera re-synchronisé depuis sa définition source. La disposition et les widgets seront rejoués ; le nom et le statut du dashboard sont préservés, et les surcharges par widget sont conservées via les slugs.',
  'Dashboards.List.Confirm.Resync.Title': 'Re-synchroniser le dashboard ?',
  'Dashboards.List.Drift.Ahead': 'En avance sur le catalogue',
  'Dashboards.List.Drift.AheadWithVersion': 'En avance sur le catalogue · catalogue v{{version}}',
  'Dashboards.List.Drift.Behind': 'Obsolète',
  'Dashboards.List.Drift.BehindWithVersion': 'Obsolète · v{{version}} disponible',
  'Dashboards.List.Drift.Unknown': 'Source inconnue',
  'Dashboards.List.Empty': 'Aucun dashboard pour le moment.',
  'Dashboards.List.ImportFromCatalogPlaceholder': '— Importer depuis le catalogue —',
  'Dashboards.List.StatusFilter.All': 'Tous',
  'Dashboards.List.Subtitle': 'Gérer les dashboards exposés à vos locataires.',
  'Dashboards.List.Title': 'Dashboards',
  'Dashboards.List.Toast.ArchiveError': "Impossible d'archiver « {{name}} »",
  'Dashboards.List.Toast.ArchiveSuccess': '« {{name}} » archivé',
  'Dashboards.List.Toast.PublishError': 'Impossible de publier « {{name}} »',
  'Dashboards.List.Toast.PublishSuccess': '« {{name}} » publié',
  'Dashboards.List.Toast.RestoreError': 'Impossible de restaurer « {{name}} »',
  'Dashboards.List.Toast.RestoreSuccess': '« {{name}} » restauré',
  'Dashboards.List.Toast.ResyncError': 'Impossible de re-synchroniser « {{name}} »',
  'Dashboards.List.Toast.ResyncSuccess':
    '« {{name}} » re-synchronisé en v{{version}} · {{widgetsAdded}} ajouté(s), {{widgetsRemoved}} retiré(s), {{overridesCarriedOver}} surcharge(s) préservée(s)',
  'Dashboards.List.WidgetsSuffix': 'widgets',
  'Dashboards.View.NotFound': 'Tableau de bord introuvable.',
} as const;
