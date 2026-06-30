import {
  changeEmailConstraints,
  forgotPasswordConstraints,
  loginConstraints,
  registerConstraints,
  resetPasswordConstraints,
  twoFactorConstraints,
} from '../validation';

// These constraints feed `createConstraintsResolver` from `@granit/react-validation`.
// They are hand-written (the Identity login endpoint uses a distinct, non-FluentValidation
// pipeline), so they are asserted directly here rather than diffed against an OpenAPI spec.

const EMAIL_PATTERN = '^[^@]+@[^@]+$';

describe('loginConstraints', () => {
  it('requires login and password with no extra rules', () => {
    expect(loginConstraints).toEqual({
      login: { required: true },
      password: { required: true },
    });
  });
});

describe('twoFactorConstraints', () => {
  it('requires the code', () => {
    expect(twoFactorConstraints).toEqual({ code: { required: true } });
  });
});

describe('forgotPasswordConstraints', () => {
  it('requires a pattern-validated email', () => {
    expect(forgotPasswordConstraints.email).toEqual({
      required: true,
      pattern: EMAIL_PATTERN,
    });
  });
});

describe('resetPasswordConstraints', () => {
  it('requires a new password of at least 8 chars and a confirmation', () => {
    expect(resetPasswordConstraints.newPassword).toEqual({ required: true, minLength: 8 });
    expect(resetPasswordConstraints.confirmPassword).toEqual({ required: true });
  });
});

describe('changeEmailConstraints', () => {
  it('requires a pattern-validated new email and the current password', () => {
    expect(changeEmailConstraints.newEmail).toEqual({
      required: true,
      pattern: EMAIL_PATTERN,
    });
    expect(changeEmailConstraints.currentPassword).toEqual({ required: true });
  });
});

describe('registerConstraints', () => {
  it('requires a pattern-validated email, an 8+ char password and a confirmation', () => {
    expect(registerConstraints.email).toEqual({ required: true, pattern: EMAIL_PATTERN });
    expect(registerConstraints.password).toEqual({ required: true, minLength: 8 });
    expect(registerConstraints.confirmPassword).toEqual({ required: true });
  });

  it('leaves first and last name optional (no rules)', () => {
    expect(registerConstraints.firstName).toEqual({});
    expect(registerConstraints.lastName).toEqual({});
  });
});
