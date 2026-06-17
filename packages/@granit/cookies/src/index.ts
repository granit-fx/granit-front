export { getCookieConsentConfig } from './api/cookie-consent-api';
export { defaultConsentState } from './consent-state';
export { getCookie, setConsentedCookie, removeCookie } from './cookie-store';
export type { CookieAttributes, ConsentedCookieOptions } from './cookie-store';
export type {
  CookieCategory,
  ConsentState,
  CookieConsentAdapter,
  CookieConsentConfigResponse,
  CookieDefinitionResponse,
  ThirdPartyServiceResponse,
} from './types/index';
