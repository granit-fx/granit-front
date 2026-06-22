// @granit/react-ui-background-jobs — admin UI for the Granit.BackgroundJobs module.
// Composes the headless @granit/react-background-jobs (data hooks + provider) with
// the foundation UI packages. The Axios client resolves from a GranitClientProvider
// in the host tree.

export { BackgroundJobListPage } from './background-job-list-page';
export { JobCard } from './components/job-card';
export { JobActions } from './components/job-actions';
export { JobStatusBadge } from './components/job-status-badge';
export { createBackgroundJobColumns } from './components/background-job-columns';

// Cron-expression rendering helpers. The module is the only cronstrue consumer, so
// it owns the locale mapping; the host calls `loadCronstrueLocale` on language change.
export { getCronstrueLocale, loadCronstrueLocale } from './cronstrue-locale';

// i18next resource bundles (flat keys, "translation" ns)
export { backgroundJobsTranslationsEn, backgroundJobsTranslationsFr } from './locales/index';
export type { BackgroundJobsTranslations } from './locales/index';
