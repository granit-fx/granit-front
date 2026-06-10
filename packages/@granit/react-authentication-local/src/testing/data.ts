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
  twoFactorMethods: ['Authenticator', 'Email', 'RecoveryCode'],
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
export const MOCK_EMAIL_OTP_CODE = '654321';
