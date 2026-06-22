// @granit/react-ui-metering — admin UI for the Metering module.
// Composes the headless @granit/react-metering (provider + hooks) with the
// foundation UI packages. The Axios client resolves from a MeteringProvider in
// the host tree (config.client or the nearest GranitClientProvider) — these pages
// do NOT wrap a provider. The usage explorer is driven by @granit/react-query-engine
// and reuses the @granit/react-ui-admin-kit querying building blocks. Meter-form
// validation is spec-driven via @granit/react-validation against the generated
// @granit/metering constraints.

export { MeterListPage } from './meter-list-page';
export { MeterDetailPage } from './meter-detail-page';
export { MeteringUsagePage } from './usage-page';

export { MeterForm } from './components/meter-form';
export type { MeterFormValues } from './components/meter-form';
export { createMeterColumns } from './components/meter-columns';
export { ArchiveMeterDialog } from './components/archive-meter-dialog';
export { RecordEventsDialog } from './components/record-events-dialog';
export { QuotaStatusCard } from './components/quota-status-card';
export { UsageSummaryCard } from './components/usage-summary-card';

// i18next resource bundles (flat keys with the literal "Metering." prefix, "translation" ns)
export { meteringTranslationsEn, meteringTranslationsFr } from './locales/index';
export type { MeteringTranslations } from './locales/index';
