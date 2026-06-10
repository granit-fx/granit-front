# @granit/react-account

React hooks for `@granit/account` -- profile, registration, password, 2FA, external logins, passkeys, session, deletion.

## Installation

```bash
pnpm add @granit/react-account
```

## API

### Components

- `AccountProvider` -- provides account configuration to the component tree

### Hooks

- `useAccountConfig()` -- access account configuration from context
- `useProfile()`, `useUpdateProfile()` -- profile management
- `useRegister()`, `useConfirmEmail(...)`, `useResendConfirmation()` -- registration
- `useChangePassword()`, `useForgotPassword()`, `useResetPassword()` -- password
- `useTwoFactorStatus()`, `useEnableTwoFactor()`, `useDisableTwoFactor()`, `useAuthenticatorKey()`, `useGenerateRecoveryCodes()` -- 2FA
- `useSendTwoFactorEmailEnrollmentCode()`, `useEnableTwoFactorEmail()`, `useDisableTwoFactorEmail()` -- email OTP factor (enrolled status via `useTwoFactorStatus().data.hasEmailOtp`)
- `useExternalLogins()`, `useChallengeExternalLogin()`, `useUnlinkExternalLogin()` -- external logins
- `usePasskeys()`, `useBeginPasskeyRegistration()`, `useCompletePasskeyRegistration()`, `useDeletePasskey()`, `useRenamePasskey(...)` -- passkeys
- `useSessionHeartbeat()`, `useBackToImpersonator()` -- session
- `useDeleteAccount()` -- account deletion

## Usage

```tsx
import { AccountProvider, useProfile, useChangePassword } from '@granit/react-account';

function App() {
  return (
    <AccountProvider client={axiosInstance} basePath="/api/account">
      <ProfilePage />
    </AccountProvider>
  );
}

function ProfilePage() {
  const { data: profile } = useProfile();
  const { mutate: changePassword } = useChangePassword();

  return <div>{profile?.email}</div>;
}
```

## License

Apache-2.0
