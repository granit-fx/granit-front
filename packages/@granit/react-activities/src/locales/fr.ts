import type { ActivitiesTranslations } from './en.js';

/**
 * French translation bundle for `@granit/react-activities`. Consumers
 * register it via:
 *
 *   i18n.addResourceBundle('fr', 'activities', activitiesTranslationsFr);
 */
export const activitiesTranslationsFr: ActivitiesTranslations = {
  Action: {
    Complete: 'Terminer',
    Cancel: 'Annuler',
    Reassign: 'Réassigner',
    Reschedule: 'Replanifier',
    Create: '+ Activité',
  },
  Status: {
    Open: 'Ouverte',
    Completed: 'Terminée',
    Cancelled: 'Annulée',
    Overdue: 'En retard',
  },
  StatusFilter: {
    All: 'Toutes',
    OpenOrOverdue: 'Ouvertes ou en retard',
  },
  List: {
    Loading: 'Chargement…',
    Error: 'Échec du chargement des activités.',
    Empty: 'Aucune activité.',
    Header: {
      Type: 'Type',
      Entity: 'Entité',
      Assignee: 'Assignée à',
      Due: 'Échéance',
      Status: 'Statut',
      Actions: 'Actions',
    },
    Pagination: {
      Previous: 'Page précédente',
      Next: 'Page suivante',
      Page: 'Page {{page}} / {{total}}',
    },
  },
  Detail: {
    Loading: 'Chargement…',
    Error: 'Échec du chargement de l’activité.',
    Field: {
      Type: 'Type',
      Entity: 'Entité',
      Assignee: 'Assignée à',
      Due: 'Échéance',
      Status: 'Statut',
      Description: 'Description',
      Completed: 'Terminée le',
      Created: 'Créée le',
    },
  },
  Calendar: {
    Loading: 'Chargement…',
    Error: 'Échec du chargement du calendrier.',
    Empty: 'Aucune activité sur cette période.',
    Nav: {
      Previous: 'Précédent',
      Next: 'Suivant',
      Today: 'Aujourd’hui',
    },
    View: {
      Day: 'Jour',
      Week: 'Semaine',
      Month: 'Mois',
      Label: 'Vue',
    },
  },
  SidePanel: {
    Title: 'Activités',
  },
  Notification: {
    Type: {
      Assigned: 'Activité assignée',
      Reminder: 'Rappel d’activité',
      Overdue: 'Activité en retard',
    },
  },
};
