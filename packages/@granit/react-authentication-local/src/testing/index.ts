// ---------------------------------------------------------------------------
// @granit/react-authentication-local/testing — Mock data & MSW handlers
// ---------------------------------------------------------------------------

export {
  MOCK_CREDENTIALS,
  MOCK_RECOVERY_CODE,
  MOCK_TOTP_CODE,
  mockLoginNotAllowed,
  mockLoginRequiresTwoFactor,
  mockLoginSuccess,
} from './data';
export { createLocalAuthHandlers } from './handlers';
