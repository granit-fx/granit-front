import { toISODateString } from '@granit/types';

import type { AccountExternalLoginInfo } from '@granit/account';
import type { AccountPasskeyInfo } from '@granit/account';
import type { AccountProfileResponse } from '@granit/account';
import type { AccountSettingsResponse } from '@granit/account';
import type { AccountTwoFactorStatusResponse } from '@granit/account';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export const mockProfile: Mutable<AccountProfileResponse> = {
  userId: 'usr_01HZ9KQXYZ1234ABCDEF' as AccountProfileResponse['userId'],
  email: 'alice@granit-showcase.local',
  emailConfirmed: true,
  firstName: 'Alice',
  lastName: 'Dupont',
  twoFactorEnabled: false,
  hasPassword: true,
  externalLogins: [],
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const mockAccountSettings: Mutable<AccountSettingsResponse> = {
  allowSelfRegistration: true,
};

// ---------------------------------------------------------------------------
// Two-factor
// ---------------------------------------------------------------------------

export const mockTwoFactorStatus: Mutable<AccountTwoFactorStatusResponse> = {
  isEnabled: false,
  hasAuthenticatorApp: false,
  recoveryCodesLeft: 0,
};

// ---------------------------------------------------------------------------
// Passkeys
// ---------------------------------------------------------------------------

export const mockPasskeys: Mutable<AccountPasskeyInfo>[] = [
  {
    id: 'pk_01HZ9KQX0000000000001' as AccountPasskeyInfo['id'],
    name: 'MacBook Pro Touch ID',
    createdAt: toISODateString('2026-01-15T08:30:00Z'),
    lastUsedAt: toISODateString('2026-03-10T09:00:00Z'),
  },
  {
    id: 'pk_01HZ9KQX0000000000002' as AccountPasskeyInfo['id'],
    name: 'iPhone Face ID',
    createdAt: toISODateString('2026-02-20T14:00:00Z'),
    lastUsedAt: null,
  },
];

// ---------------------------------------------------------------------------
// External logins
// ---------------------------------------------------------------------------

export const mockExternalLogins: Mutable<AccountExternalLoginInfo>[] = [
  {
    loginProvider: 'Google',
    providerKey: 'google|alice@gmail.com',
    providerDisplayName: 'Google',
  },
];
