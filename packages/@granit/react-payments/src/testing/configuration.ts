// ---------------------------------------------------------------------------
// @granit/react-payments/testing — platform-admin payment configuration
// handlers (provider catalog + per-method activate/deactivate/resync).
//
// Complements createPaymentsHandlers (transactions / methods / checkout) with
// the `/configuration` surface consumed by the payment configuration admin UI.
// ---------------------------------------------------------------------------

import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  PaymentCatalogMethod,
  PaymentMethodCapabilityResponse,
  PaymentMethodConfigurationItem,
  PaymentProviderCatalogResponse,
  PaymentProviderConfiguration,
} from '@granit/payments';

const cardCapability: PaymentMethodCapabilityResponse = {
  supportedCountries: [],
  supportedCurrencies: ['EUR', 'USD', 'GBP'],
  supportedSequenceTypes: ['oneoff', 'recurring'],
  amountBounds: [{ currencyCode: 'EUR', minAmount: 50, maxAmount: 99_999_999 }],
};

const bankRedirectCapability: PaymentMethodCapabilityResponse = {
  supportedCountries: ['BE', 'NL', 'FR', 'DE', 'AT'],
  supportedCurrencies: ['EUR'],
  supportedSequenceTypes: ['oneoff'],
  amountBounds: [{ currencyCode: 'EUR', minAmount: 100, maxAmount: 50_000_00 }],
};

const sepaCapability: PaymentMethodCapabilityResponse = {
  supportedCountries: ['BE', 'NL', 'FR', 'DE', 'IT', 'ES', 'AT', 'PT', 'IE', 'LU'],
  supportedCurrencies: ['EUR'],
  supportedSequenceTypes: ['oneoff', 'recurring'],
  amountBounds: [{ currencyCode: 'EUR', minAmount: 100, maxAmount: 100_000_00 }],
};

const walletCapability: PaymentMethodCapabilityResponse = {
  supportedCountries: [],
  supportedCurrencies: ['EUR', 'USD'],
  supportedSequenceTypes: ['oneoff'],
  amountBounds: [],
};

interface MockMethod {
  readonly methodType: string;
  readonly displayLabel: string;
  readonly category: number;
  readonly capability: PaymentMethodCapabilityResponse;
}

interface MockProvider {
  readonly providerName: string;
  readonly methods: readonly MockMethod[];
}

/** Provider/method catalog backing the configuration mocks. */
export const mockPaymentProviders: readonly MockProvider[] = [
  {
    providerName: 'stripe',
    methods: [
      { methodType: 'card', displayLabel: 'Card', category: 0, capability: cardCapability },
      {
        methodType: 'bancontact',
        displayLabel: 'Bancontact',
        category: 1,
        capability: bankRedirectCapability,
      },
      {
        methodType: 'sepa_debit',
        displayLabel: 'SEPA Direct Debit',
        category: 3,
        capability: sepaCapability,
      },
      {
        methodType: 'apple_pay',
        displayLabel: 'Apple Pay',
        category: 4,
        capability: walletCapability,
      },
    ],
  },
  {
    providerName: 'mollie',
    methods: [
      {
        methodType: 'bancontact',
        displayLabel: 'Bancontact',
        category: 1,
        capability: bankRedirectCapability,
      },
      {
        methodType: 'ideal',
        displayLabel: 'iDEAL',
        category: 1,
        capability: { ...bankRedirectCapability, supportedCountries: ['NL'] },
      },
      { methodType: 'eps', displayLabel: 'EPS', category: 1, capability: bankRedirectCapability },
    ],
  },
];

type ActivationKey = `${string}::${string}`;
const key = (provider: string, method: string): ActivationKey => `${provider}::${method}`;

/**
 * Create stateful MSW handlers for the payment configuration admin surface
 * (`/configuration`). Activation state is per-invocation, so each call yields
 * an isolated mock backend.
 *
 * @param baseUrl - API base path (default: `/api/v1/payments`)
 */
export function createPaymentsConfigurationHandlers(baseUrl = DEFAULT_BASE_PATH) {
  const activated = new Map<ActivationKey, PaymentMethodCapabilityResponse | null>();

  // Seed: a couple of methods activated by default so the UI is not empty.
  activated.set(key('stripe', 'card'), cardCapability);
  activated.set(key('mollie', 'bancontact'), bankRedirectCapability);
  // Legacy record without snapshot — exercises the "pending refresh" badge.
  activated.set(key('mollie', 'ideal'), null);

  function buildConfiguration(provider: MockProvider): PaymentProviderConfiguration {
    const items: PaymentMethodConfigurationItem[] = provider.methods.map((m) => {
      const k = key(provider.providerName, m.methodType);
      const isActive = activated.has(k);
      return {
        methodType: m.methodType,
        displayLabel: m.displayLabel,
        category: m.category,
        activated: isActive,
        capabilitySnapshot: isActive ? (activated.get(k) ?? null) : null,
      };
    });
    return { providerName: provider.providerName, methods: items };
  }

  function buildCatalog(provider: MockProvider): PaymentProviderCatalogResponse {
    const methods: PaymentCatalogMethod[] = provider.methods.map((m) => {
      const k = key(provider.providerName, m.methodType);
      const isActive = activated.has(k);
      const snapshot = isActive ? activated.get(k) : null;
      return {
        methodType: m.methodType,
        category: m.category,
        displayLabel: m.displayLabel,
        capability: m.capability,
        activated: isActive,
        hasSnapshot: isActive && snapshot !== null,
      };
    });
    return { providerName: provider.providerName, methods };
  }

  function setActive(
    provider: string | readonly string[] | undefined,
    method: string | readonly string[] | undefined,
    capability: PaymentMethodCapabilityResponse | null
  ): PaymentMethodConfigurationItem | null {
    const found = mockPaymentProviders.find((p) => p.providerName === provider);
    const m = found?.methods.find((x) => x.methodType === method);
    if (!found || !m) return null;
    if (capability === null) activated.delete(key(found.providerName, m.methodType));
    else activated.set(key(found.providerName, m.methodType), capability);
    return {
      methodType: m.methodType,
      displayLabel: m.displayLabel,
      category: m.category,
      activated: capability !== null,
      capabilitySnapshot: capability,
    };
  }

  return [
    http.get(`${baseUrl}/configuration`, () =>
      HttpResponse.json(mockPaymentProviders.map(buildConfiguration))
    ),

    http.get(`${baseUrl}/configuration/catalog`, ({ request }) => {
      const providerName = new URL(request.url).searchParams.get('providerName');
      const provider = mockPaymentProviders.find((p) => p.providerName === providerName);
      if (!provider) {
        return HttpResponse.json({ message: `Unknown provider ${providerName}` }, { status: 404 });
      }
      return HttpResponse.json(buildCatalog(provider));
    }),

    http.post(`${baseUrl}/configuration/:provider/:method/activate`, ({ params }) => {
      const method = mockPaymentProviders
        .find((p) => p.providerName === params.provider)
        ?.methods.find((m) => m.methodType === params.method);
      const item = setActive(params.provider, params.method, method?.capability ?? null);
      return item
        ? HttpResponse.json(item)
        : HttpResponse.json({ message: 'Unknown provider/method' }, { status: 404 });
    }),

    http.post(`${baseUrl}/configuration/:provider/:method/deactivate`, ({ params }) => {
      const item = setActive(params.provider, params.method, null);
      return item
        ? HttpResponse.json(item)
        : HttpResponse.json({ message: 'Unknown provider/method' }, { status: 404 });
    }),

    http.post(`${baseUrl}/configuration/:provider/:method/resync`, ({ params }) => {
      const method = mockPaymentProviders
        .find((p) => p.providerName === params.provider)
        ?.methods.find((m) => m.methodType === params.method);
      const item = setActive(params.provider, params.method, method?.capability ?? null);
      return item
        ? HttpResponse.json(item)
        : HttpResponse.json({ message: 'Unknown provider/method' }, { status: 404 });
    }),
  ];
}
