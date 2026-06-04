import { toISODateString } from '@granit/types';

import type {
  AccountAuthenticatorKeyResponse,
  AccountLoginResponse,
  AccountProfileResponse,
  AccountTwoFactorStatusResponse,
  IdentityLocalConfigResponse,
  PasskeyInfoResponse,
} from '@granit/authentication-local';

export const mockLoginSuccess: AccountLoginResponse = {
  succeeded: true,
  requiresTwoFactor: false,
  isLockedOut: false,
  isNotAllowed: false,
};

export const mockLoginRequiresTwoFactor: AccountLoginResponse = {
  succeeded: false,
  requiresTwoFactor: true,
  isLockedOut: false,
  isNotAllowed: false,
};

export const mockLoginNotAllowed: AccountLoginResponse = {
  succeeded: false,
  requiresTwoFactor: false,
  isLockedOut: false,
  isNotAllowed: true,
};

export const MOCK_CREDENTIALS = {
  login: 'admin@granit-showcase.local',
  password: 'test-password-mock-only', // NOSONAR — test fixture, not a real credential
} as const;

export const MOCK_TOTP_CODE = '123456';
export const MOCK_RECOVERY_CODE = 'XXXX-XXXX-XXXX';

export const mockProfile: AccountProfileResponse = {
  userId: 'd2c47314-4d08-4952-98b1-a1b8a6e22ef1',
  email: 'admin@granit-showcase.local',
  emailConfirmed: true,
  firstName: 'Ada',
  lastName: 'Lovelace',
  twoFactorEnabled: false,
  hasPassword: true,
  externalLogins: [],
};

export const mockTwoFactorStatus: AccountTwoFactorStatusResponse = {
  isEnabled: false,
  hasAuthenticatorApp: false,
  recoveryCodesLeft: 0,
};

export const mockAuthenticatorKey: AccountAuthenticatorKeyResponse = {
  sharedKey: 'JBSWY3DPEHPK3PXP',
  qrCodeUri:
    'otpauth://totp/Granit:admin@granit-showcase.local?secret=JBSWY3DPEHPK3PXP&issuer=Granit',
};

export const mockRecoveryCodes: readonly string[] = [
  'AAAA-1111',
  'BBBB-2222',
  'CCCC-3333',
  'DDDD-4444',
  'EEEE-5555',
];

export const mockPasskeys: PasskeyInfoResponse[] = [
  {
    id: 'pk-1',
    name: 'MacBook Touch ID',
    createdAt: toISODateString('2026-02-01T10:00:00Z'),
    lastUsedAt: toISODateString('2026-03-09T08:30:00Z'),
  },
  {
    id: 'pk-2',
    name: null,
    createdAt: toISODateString('2026-01-15T09:00:00Z'),
    lastUsedAt: null,
  },
];

export const mockAccountConfig: IdentityLocalConfigResponse = {
  allowSelfRegistration: true,
};
