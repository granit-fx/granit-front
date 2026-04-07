import type { AccountLoginResponse } from '@granit/authentication-local';

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
  password: 'test-password-mock-only',
} as const;

export const MOCK_TOTP_CODE = '123456';
export const MOCK_RECOVERY_CODE = 'XXXX-XXXX-XXXX';
