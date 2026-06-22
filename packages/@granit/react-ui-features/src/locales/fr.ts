// @granit/react-ui-features — i18next resource bundle (flat keys, "translation" ns).
// Register in the host app:
//   import { featuresTranslationsFr } from "@granit/react-ui-features";
//   i18n.addResourceBundle("fr", "translation", featuresTranslationsFr, true, true);

export const featuresTranslationsFr = {
  'Features.Detail.AllowedValues': 'Valeurs autorisées',
  'Features.Detail.BackToList': 'Retour à la liste',
  'Features.Detail.CurrentState': 'État actuel',
  'Features.Detail.CurrentValue': 'Valeur actuelle',
  'Features.Detail.DefaultValue': 'Valeur par défaut',
  'Features.Detail.Definition': 'Définition',
  'Features.Detail.Name': 'Nom',
  'Features.Detail.NotFound': 'Fonctionnalité introuvable',
  'Features.Detail.Range': 'Plage',
  'Features.Detail.Type': 'Type',
  'Features.Group.Count': '{{count}} fonctionnalités',
  'Features.List.Description': 'Gérer les feature flags et les surcharges',
  'Features.List.Empty': 'Aucun feature flag trouvé',
  'Features.List.Title': 'Feature Flags',
  'Features.Override.Configure': 'Configurer la surcharge',
  'Features.Override.NumericRange': 'Plage numérique',
  'Features.Override.Remove': 'Supprimer la surcharge',
  'Features.Override.RemoveError': 'Échec de la suppression de la surcharge',
  'Features.Override.RemoveSuccess': 'Surcharge supprimée avec succès',
  'Features.Override.Save': 'Enregistrer',
  'Features.Override.SetError': 'Échec de la définition de la surcharge',
  'Features.Override.SetSuccess': 'Surcharge définie avec succès',
  'Features.Override.Title': 'Surcharge',
  'Features.Override.Value': 'Valeur',
  'Features.Type.Numeric': 'Numérique',
  'Features.Type.Selection': 'Sélection',
  'Features.Type.Toggle': 'Basculer',
  'Features.Value.Disabled': 'Désactivé',
  'Features.Value.Enabled': 'Activé',
} as const;
