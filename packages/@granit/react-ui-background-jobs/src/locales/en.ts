// @granit/react-ui-background-jobs — i18next resource bundle (flat keys, "translation" ns).
// Register in the host app:
//   import { backgroundJobsTranslationsEn } from "@granit/react-ui-background-jobs";
//   i18n.addResourceBundle("en", "translation", backgroundJobsTranslationsEn, true, true);

export const backgroundJobsTranslationsEn = {
  'BackgroundJobs.Actions.Pause': 'Pause',
  'BackgroundJobs.Actions.Resume': 'Resume',
  'BackgroundJobs.Actions.Trigger': 'Trigger now',
  'BackgroundJobs.Columns.CronExpression': 'Schedule',
  'BackgroundJobs.Columns.Failures': 'Failures',
  'BackgroundJobs.Columns.JobName': 'Job name',
  'BackgroundJobs.Columns.LastExecution': 'Last execution',
  'BackgroundJobs.Columns.NextExecution': 'Next execution',
  'BackgroundJobs.Columns.Status': 'Status',
  'BackgroundJobs.DeadLetters': '{{count}} dead-letter message',
  'BackgroundJobs.DeadLetters_other': '{{count}} dead-letter messages',
  'BackgroundJobs.Failures': '{{count}} consecutive failure',
  'BackgroundJobs.Failures_other': '{{count}} consecutive failures',
  'BackgroundJobs.LastExecution': 'Last execution',
  'BackgroundJobs.Never': 'Never',
  'BackgroundJobs.NextExecution': 'Next execution',
  'BackgroundJobs.NoJobs': 'No background jobs registered',
  'BackgroundJobs.NotScheduled': 'Not scheduled',
  'BackgroundJobs.Status.Active': 'Active',
  'BackgroundJobs.Status.Failing': 'Failing',
  'BackgroundJobs.Status.Paused': 'Paused',
  'BackgroundJobs.Subtitle': 'Monitor and manage recurring system tasks',
  'BackgroundJobs.Title': 'Background Jobs',
  'BackgroundJobs.View.Kanban': 'Card view',
  'BackgroundJobs.View.List': 'List view',
} as const;

export type BackgroundJobsTranslations = typeof backgroundJobsTranslationsEn;
