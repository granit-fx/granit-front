import type { ConsentDecisionRequest, ConsentState, CookieConsentMode } from './types/index';

/** Options for {@link toConsentDecision}. */
export interface ToConsentDecisionOptions {
  /**
   * Identifier of the CMP that captured the decision.
   * @default 'cookieconsent'
   */
  readonly cmpSource?: string;
  /** Consent model the CMP applied. Omit to let the backend default to `OptIn`. */
  readonly mode?: CookieConsentMode;
}

/**
 * Projects a {@link ConsentState} into the {@link ConsentDecisionRequest} body of
 * `POST /cookies/consent`. Category keys are already the snake_case names the
 * backend ledger expects, so granted/denied lists partition the state directly.
 */
export function toConsentDecision(
  consents: ConsentState,
  options: ToConsentDecisionOptions = {}
): ConsentDecisionRequest {
  const grantedCategories: string[] = [];
  const deniedCategories: string[] = [];
  for (const [category, granted] of Object.entries(consents)) {
    (granted ? grantedCategories : deniedCategories).push(category);
  }

  return {
    grantedCategories,
    deniedCategories,
    ...(options.mode ? { mode: options.mode } : {}),
    cmpSource: options.cmpSource ?? 'cookieconsent',
  };
}
