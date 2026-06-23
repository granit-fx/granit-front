/**
 * French admin strings for the Localization UI. Mirrors {@link localizationAdminTranslationsEn}.
 */
export const localizationAdminTranslationsFr = {
  'Localization.Actions.CreateOverride': 'Ajouter une surcharge',
  'Localization.Actions.DeleteOverride': "Supprimer l'override",
  'Localization.Columns.CultureName': 'Langue',
  'Localization.Columns.Key': 'Clé',
  'Localization.Columns.ModifiedAt': 'Modifié le',
  'Localization.Columns.ModifiedBy': 'Modifié par',
  'Localization.Columns.ResourceName': 'Module',
  'Localization.Columns.Value': 'Valeur',
  'Localization.CreateDialog.Description':
    'Surcharge une traduction pour un module, une langue et une clé donnés.',
  'Localization.CreateDialog.Title': 'Ajouter une surcharge de traduction',
  'Localization.DeleteDialog.Message':
    "Êtes-vous sûr de vouloir supprimer l'override pour la clé « {{key}} » ({{culture}}) ? La traduction reviendra à sa valeur par défaut.",
  'Localization.DeleteDialog.Title': "Supprimer l'override",
  'Localization.DeleteError': "Échec de la suppression de l'override",
  'Localization.DeleteSuccess': 'Override supprimé avec succès',
  'Localization.EditDialog.Description':
    "Modifier la valeur de l'override pour cette clé de traduction.",
  'Localization.EditDialog.Title': 'Modifier la traduction',
  'Localization.EditDialog.Value': "Valeur de l'override",
  'Localization.EditDialog.ValueRequired': 'La valeur est obligatoire',
  'Localization.Languages.Default': 'Défaut',
  'Localization.Languages.Subtitle': "Langues disponibles dans l'application",
  'Localization.Languages.Title': 'Langues',
  'Localization.SaveError': 'Échec de la mise à jour de la traduction',
  'Localization.SaveSuccess': 'Traduction mise à jour avec succès',
  'Localization.Subtitle': 'Gérer les overrides de traduction par module et par langue',
  'Localization.Title': 'Gestion des localisations',
} as const;
