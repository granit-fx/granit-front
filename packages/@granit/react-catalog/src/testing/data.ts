import { toEntityId } from '@granit/types';

import type { ProductResponse } from '@granit/catalog';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export const sampleProducts: Mutable<ProductResponse>[] = [
  {
    id: toEntityId<'Product'>('prd_001'),
    sku: 'API-CALLS',
    name: 'API Calls',
    description: 'Per-call billing for the public API.',
    type: 'Metered',
    unit: 'call',
    lifecycleStatus: 'Published',
    metadata: { tier: 'standard' },
    externalMappings: [
      {
        id: toEntityId<'ProductExternalMapping'>('pem_001'),
        providerName: 'Stripe',
        externalId: 'prod_AbC123',
      },
    ],
  },
  {
    id: toEntityId<'Product'>('prd_002'),
    sku: 'STORAGE-GB',
    name: 'Object Storage',
    description: 'Per-GB monthly storage.',
    type: 'Metered',
    unit: 'GB',
    lifecycleStatus: 'Published',
    metadata: {},
    externalMappings: [],
  },
  {
    id: toEntityId<'Product'>('prd_003'),
    sku: 'ONBOARDING',
    name: 'Onboarding Service',
    description: 'White-glove onboarding (one-off).',
    type: 'Service',
    unit: 'session',
    lifecycleStatus: 'Draft',
    metadata: {},
    externalMappings: [],
  },
];
