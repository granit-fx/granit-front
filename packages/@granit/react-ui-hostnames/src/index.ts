// @granit/react-ui-hostnames — admin UI for the managed Hostnames module.
// Composes the headless @granit/react-hostnames (provider + hooks) with the
// foundation UI packages. The Axios client resolves from a GranitClientProvider
// in the host tree (via the HostnamesProvider); permission gating uses
// @granit/react-authorization's usePermissions.

export { HostnamesPage } from './hostnames-page';
export { HostnameStatusBadge, CertStatusBadge } from './components/hostname-status-badge';
export { DnsDetails } from './components/hostname-dns-details';
export { RowActions } from './components/hostname-row-actions';
export { AddHostnameDialog } from './components/hostname-add-dialog';

// i18next resource bundles (flat keys, "translation" ns)
export { hostnamesTranslationsEn, hostnamesTranslationsFr } from './locales/index';
export type { HostnamesTranslations } from './locales/index';
