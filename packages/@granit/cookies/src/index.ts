export { getCookieConsentConfig, recordCookieConsentDecision } from './api/cookie-consent-api';
export { defaultConsentState } from './consent-state';
export { toConsentDecision } from './consent-decision';
export type { ToConsentDecisionOptions } from './consent-decision';
export { getCookie, setConsentedCookie, removeCookie } from './cookie-store';
export type { CookieAttributes, ConsentedCookieOptions } from './cookie-store';
export type {
  CookieCategory,
  ConsentState,
  ConsentDecisionRequest,
  CookieConsentAdapter,
  CookieConsentConfigResponse,
  CookieConsentMode,
  CookieDefinitionResponse,
  ThirdPartyServiceResponse,
} from './types/index';
