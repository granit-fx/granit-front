import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { getCookieConsentConfig, recordCookieConsentDecision } from '../cookie-consent-api';

import type { ConsentDecisionRequest, CookieConsentConfigResponse } from '../../types/index';

describe('getCookieConsentConfig', () => {
  it('GETs {basePath}/config and returns the response body', async () => {
    const client = createMockClient();
    const config: CookieConsentConfigResponse = {
      cookies: [
        { name: 'session', category: 'strictly_necessary', retentionDays: 1, purpose: 'Auth' },
      ],
      services: [{ name: 'matomo', category: 'analytics', cookiePatterns: ['^_pk_'] }],
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(config));

    const result = await getCookieConsentConfig(client, '/cookies');

    expect(client.get).toHaveBeenCalledWith('/cookies/config');
    expect(result).toEqual(config);
  });
});

describe('recordCookieConsentDecision', () => {
  it('POSTs the decision to {basePath}/consent', async () => {
    const client = createMockClient();
    const request: ConsentDecisionRequest = {
      grantedCategories: ['strictly_necessary', 'analytics'],
      deniedCategories: ['marketing', 'sale_or_sharing'],
      mode: 'OptIn',
      cmpSource: 'cookieconsent',
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    await recordCookieConsentDecision(client, '/cookies', request);

    expect(client.post).toHaveBeenCalledWith('/cookies/consent', request);
  });
});
