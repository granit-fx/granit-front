import type { SchemaConstraints } from '@granit/validation';

/**
 * Login form constraints — manual (not from OpenAPI spec since the Identity
 * login endpoint uses a different validation pipeline). The forms feed these to
 * `createConstraintsResolver` from `@granit/react-validation`.
 */
export const loginConstraints: SchemaConstraints = {
  login: { required: true },
  password: { required: true },
};

export interface LoginFormValues {
  login: string;
  password: string;
  rememberMe: boolean;
}

export const twoFactorConstraints: SchemaConstraints = {
  code: { required: true },
};

export interface TwoFactorFormValues {
  code: string;
}

export const forgotPasswordConstraints: SchemaConstraints = {
  email: { required: true, pattern: '^[^@]+@[^@]+$' },
};

export interface ForgotPasswordFormValues {
  email: string;
}

export const resetPasswordConstraints: SchemaConstraints = {
  newPassword: { required: true, minLength: 8 },
  confirmPassword: { required: true },
};

export interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

export const changeEmailConstraints: SchemaConstraints = {
  newEmail: { required: true, pattern: '^[^@]+@[^@]+$' },
  currentPassword: { required: true },
};

export interface ChangeEmailFormValues {
  newEmail: string;
  currentPassword: string;
}

export const registerConstraints: SchemaConstraints = {
  email: { required: true, pattern: '^[^@]+@[^@]+$' },
  firstName: {},
  lastName: {},
  password: { required: true, minLength: 8 },
  confirmPassword: { required: true },
};

export interface RegisterFormValues {
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
  confirmPassword: string;
}
