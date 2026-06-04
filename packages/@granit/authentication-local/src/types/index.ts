// Login (anonymous: password, 2FA, passkey assertion)
export type {
  AccountLoginRequest,
  AccountLoginResponse,
  AccountPasskeyLoginRequest,
  AccountTwoFactorLoginRequest,
} from './account-login';

// Registration
export type { AccountRegisterRequest } from './account-registration';

// Password management
export type {
  AccountForgotPasswordRequest,
  AccountPasswordChangeRequest,
  AccountPasswordResetRequest,
} from './account-password';

// Email change
export type { AccountChangeEmailRequest, AccountConfirmEmailChangeRequest } from './account-email';

// Profile
export type { AccountProfileResponse, AccountProfileUpdateRequest } from './account-profile';

// Two-factor management
export type {
  AccountAuthenticatorKeyResponse,
  AccountGenerateRecoveryCodesRequest,
  AccountRecoveryCodesResponse,
  AccountTwoFactorDisableRequest,
  AccountTwoFactorEnableRequest,
  AccountTwoFactorEnableResponse,
  AccountTwoFactorStatusResponse,
} from './account-two-factor';

// Passkey management
export type {
  PasskeyInfoResponse,
  PasskeyRegistrationRequest,
  PasskeyRenameRequest,
} from './account-passkey';

// Account deletion
export type { AccountDeleteRequest } from './account-deletion';

// Public config
export type { IdentityLocalConfigResponse } from './account-config';
