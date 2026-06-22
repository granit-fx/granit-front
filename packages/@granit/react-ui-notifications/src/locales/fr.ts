// @granit/react-ui-notifications — i18next resource bundle (flat keys, "translation" ns).
// Register in the host app:
//   import { notificationsTranslationsFr } from "@granit/react-ui-notifications";
//   i18n.addResourceBundle("fr", "translation", notificationsTranslationsFr, true, true);

export const notificationsTranslationsFr = {
  'Notifications.Channels.Email': 'Email',
  'Notifications.Channels.InApp': 'In-app',
  'Notifications.Channels.Push': 'Push',
  'Notifications.DisablePush': 'Désactiver les notifications push',
  'Notifications.EnablePush': 'Activer les notifications push',
  'Notifications.Inbox': 'Boîte de réception',
  'Notifications.LoadMore': 'Charger plus',
  'Notifications.MarkAllRead': 'Tout marquer comme lu',
  'Notifications.MarkRead': 'Marquer comme lu',
  'Notifications.NewNotification': 'Nouvelle notification',
  'Notifications.NoNotifications': 'Aucune notification',
  'Notifications.NoNotificationsDescription': 'Vous êtes à jour !',
  'Notifications.NoTypesAvailable': 'Aucun type de notification disponible.',
  'Notifications.OpenLink': 'Ouvrir',
  'Notifications.Preferences': 'Préférences',
  'Notifications.PreferencesDescription': 'Choisissez comment vous souhaitez être notifié',
  'Notifications.PreferencesSubtitle': 'Gérer les préférences de notifications',
  'Notifications.PushDenied': 'Notifications push refusées par le navigateur',
  'Notifications.Saving': 'Enregistrement...',
  'Notifications.Severity.Error': 'Erreur',
  'Notifications.Severity.Fatal': 'Critique',
  'Notifications.Severity.Info': 'Info',
  'Notifications.Severity.Success': 'Succès',
  'Notifications.Severity.Warning': 'Avertissement',
  'Notifications.Subtitle': 'Gérez vos notifications et préférences',
  'Notifications.Title': 'Notifications',
  'Notifications.ViewAll': 'Voir toutes les notifications',
  'Notifications.WebPush': 'Notifications Web Push',
  'Notifications.WebPushDescription': 'Recevoir des notifications push dans le navigateur',
} as const;
