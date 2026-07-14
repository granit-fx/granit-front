import { describe, expect, it } from 'vitest';

import { toConsentDecision } from '../consent-decision';
import { defaultConsentState } from '../consent-state';

import type { ConsentState } from '../types/index';

describe('toConsentDecision', () => {
  it('partitions the consent state into granted and denied snake_case names', () => {
    const consents: ConsentState = {
      strictly_necessary: true,
      preferences: true,
      analytics: false,
      marketing: false,
      sale_or_sharing: false,
    };

    const decision = toConsentDecision(consents);

    expect(decision.grantedCategories).toEqual(['strictly_necessary', 'preferences']);
    expect(decision.deniedCategories).toEqual(['analytics', 'marketing', 'sale_or_sharing']);
  });

  it('defaults cmpSource to "cookieconsent" and omits mode', () => {
    const decision = toConsentDecision(defaultConsentState());

    expect(decision.cmpSource).toBe('cookieconsent');
    expect(decision).not.toHaveProperty('mode');
  });

  it('honours cmpSource and mode overrides', () => {
    const decision = toConsentDecision(defaultConsentState(), {
      cmpSource: 'my-cmp',
      mode: 'OptOut',
    });

    expect(decision.cmpSource).toBe('my-cmp');
    expect(decision.mode).toBe('OptOut');
  });
});
