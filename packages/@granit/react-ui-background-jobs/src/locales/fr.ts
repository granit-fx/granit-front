// @granit/react-ui-background-jobs — i18next resource bundle (flat keys, "translation" ns).
// Register in the host app:
//   import { backgroundJobsTranslationsFr } from "@granit/react-ui-background-jobs";
//   i18n.addResourceBundle("fr", "translation", backgroundJobsTranslationsFr, true, true);

export const backgroundJobsTranslationsFr = {
  'BackgroundJobs.Actions.Pause': 'Mettre en pause',
  'BackgroundJobs.Actions.Resume': 'Reprendre',
  'BackgroundJobs.Actions.Trigger': 'Exécuter maintenant',
  'BackgroundJobs.Columns.CronExpression': 'Planification',
  'BackgroundJobs.Columns.Failures': 'Échecs',
  'BackgroundJobs.Columns.JobName': 'Nom de la tâche',
  'BackgroundJobs.Columns.LastExecution': 'Dernière exécution',
  'BackgroundJobs.Columns.NextExecution': 'Prochaine exécution',
  'BackgroundJobs.Columns.Status': 'Statut',
  'BackgroundJobs.DeadLetters': '{{count}} message en dead-letter',
  'BackgroundJobs.DeadLetters_other': '{{count}} messages en dead-letter',
  'BackgroundJobs.Failures': '{{count}} échec consécutif',
  'BackgroundJobs.Failures_other': '{{count}} échecs consécutifs',
  'BackgroundJobs.LastExecution': 'Dernière exécution',
  'BackgroundJobs.Never': 'Jamais',
  'BackgroundJobs.NextExecution': 'Prochaine exécution',
  'BackgroundJobs.NoJobs': 'Aucune tâche planifiée enregistrée',
  'BackgroundJobs.NotScheduled': 'Non planifiée',
  'BackgroundJobs.Status.Active': 'Actif',
  'BackgroundJobs.Status.Failing': 'En erreur',
  'BackgroundJobs.Status.Paused': 'En pause',
  'BackgroundJobs.Subtitle': 'Surveiller et gérer les tâches récurrentes du système',
  'BackgroundJobs.Title': 'Tâches planifiées',
  'BackgroundJobs.View.Kanban': 'Vue en cartes',
  'BackgroundJobs.View.List': 'Vue en liste',
} as const;
