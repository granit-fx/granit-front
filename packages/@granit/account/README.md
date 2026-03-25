# @granit/account

Account self-service types and API -- registration, profile, password, 2FA/TOTP, external logins, passkeys/WebAuthn, session, deletion. Mirrors `Granit.OpenIddict.Endpoints` .NET contract.

## Installation

```bash
pnpm add @granit/account
```

## API

### Types

- `AccountRegisterRequest`, `AccountRegisterResponse` -- registration
- `AccountProfileResponse`, `AccountProfileUpdateRequest` -- profile management
- `AccountPasswordChangeRequest`, `AccountForgotPasswordRequest`, `AccountPasswordResetRequest` -- password flows
- `AccountTwoFactorStatusResponse`, `AccountTwoFactorEnableRequest`, `AccountTwoFactorEnableResponse` -- 2FA
- `AccountAuthenticatorKeyResponse`, `AccountRecoveryCodesResponse` -- authenticator setup
- `AccountExternalLoginInfo`, `AccountExternalLoginCallbackResponse` -- external logins
- `AccountPasskeyInfo`, `AccountPasskeyRegistrationRequest`, `AccountPasskeyCreatedResponse`, `AccountPasskeyRenameRequest` -- passkeys
- `AccountImpersonationResult` -- impersonation
- `AccountDeleteRequest` -- account deletion

### Functions

- `registerAccount(...)`, `confirmEmail(...)`, `resendConfirmationEmail(...)` -- registration
- `getProfile(...)`, `updateProfile(...)` -- profile
- `changePassword(...)`, `forgotPassword(...)`, `resetPassword(...)` -- password
- `getTwoFactorStatus(...)`, `enableTwoFactor(...)`, `disableTwoFactor(...)`, `getAuthenticatorKey(...)`, `generateRecoveryCodes(...)` -- 2FA
- `getExternalLogins(...)`, `challengeExternalLogin(...)`, `externalLoginCallback(...)`, `unlinkExternalLogin(...)` -- external logins
- `getPasskeys(...)`, `beginPasskeyRegistration(...)`, `completePasskeyRegistration(...)`, `beginPasskeyAssertion(...)`, `deletePasskey(...)`, `renamePasskey(...)` -- passkeys
- `sessionHeartbeat(...)`, `backToImpersonator(...)` -- session
- `deleteAccount(...)` -- deletion

## Usage

```ts
import { getProfile, changePassword } from '@granit/account';
import type { AccountProfileResponse } from '@granit/account';

const profile: AccountProfileResponse = await getProfile(client, basePath);
await changePassword(client, basePath, { currentPassword: '...', newPassword: '...' });
```

## License

Apache-2.0
