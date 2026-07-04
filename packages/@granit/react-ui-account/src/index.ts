// Pages — self-service account
export { ProfilePage } from './profile-page';
export { DeleteAccountPage } from './delete-account-page';
export { SessionsPage } from './sessions-page';

// Pages — security
export { PasswordPage } from './security/password-page';
export { TwoFactorPage } from './security/two-factor-page';
export { PasskeysPage } from './security/passkeys-page';
export { ExternalLoginsPage } from './security/external-logins-page';
export { SecurityReviewPage } from './security/security-review-page';

// Components
export { MySessionsCard } from './components/my-sessions-card';
export { MyDevicesCard } from './components/my-devices-card';
// External-login UI is owned by @granit/react-ui-authentication-local (the sign-in
// flow is its primary consumer); re-exported here to keep this package's public API
// stable for the account "link provider" screen.
export { ExternalLoginButtons, ExternalProviderIcon } from '@granit/react-ui-authentication-local';

// Hooks / utilities
export {
  useAvailableExternalProviders,
  type AvailableExternalProviders,
  type ExternalLoginProvider,
} from './security/use-available-external-providers';
export { getDefaultPasskeyName } from './security/passkey-device-name';

// i18n bundles
export { accountTranslationsEn, accountTranslationsFr } from './locales';
