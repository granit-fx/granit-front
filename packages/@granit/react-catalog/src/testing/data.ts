import { toEntityId } from '@granit/types';

import type { ProductResponse } from '@granit/catalog';

/** Mock product fixtures used by MSW handlers + tests. */
export const mockProducts: ProductResponse[] = [
  {
    id: toEntityId<'Product'>('1f10f5a4-1c08-4c4f-9b6d-9c2b9ad9c001'),
    sku: 'BASIC-MONTHLY',
    name: 'Basic plan — monthly',
    description: 'Up to 100 users. Billed monthly.',
    type: 'Service',
    unit: 'month',
    lifecycleStatus: 'Published',
    metadata: { tier: 'basic', billingCycle: 'monthly' },
    externalMappings: [
      {
        id: toEntityId<'ProductExternalMapping'>('2a20b6c4-3d09-4e5f-a6b7-1c2d3e4f5001'),
        providerName: 'Stripe',
        externalId: 'price_1Q0BasicMonthly',
      },
    ],
  },
  {
    id: toEntityId<'Product'>('1f10f5a4-1c08-4c4f-9b6d-9c2b9ad9c002'),
    sku: 'PRO-YEARLY',
    name: 'Pro plan — yearly',
    description: 'Unlimited users. Billed yearly (16% discount).',
    type: 'Service',
    unit: 'year',
    lifecycleStatus: 'Published',
    metadata: { tier: 'pro', billingCycle: 'yearly' },
    externalMappings: [
      {
        id: toEntityId<'ProductExternalMapping'>('2a20b6c4-3d09-4e5f-a6b7-1c2d3e4f5002'),
        providerName: 'Stripe',
        externalId: 'price_1Q0ProYearly',
      },
      {
        id: toEntityId<'ProductExternalMapping'>('2a20b6c4-3d09-4e5f-a6b7-1c2d3e4f5003'),
        providerName: 'Avalara',
        externalId: 'tax_pro_yearly',
      },
    ],
  },
  {
    id: toEntityId<'Product'>('1f10f5a4-1c08-4c4f-9b6d-9c2b9ad9c003'),
    sku: 'ADDON-STORAGE',
    name: 'Extra storage — 100 GB',
    description: null,
    type: 'Service',
    unit: 'GB-month',
    lifecycleStatus: 'Draft',
    metadata: {},
    externalMappings: [],
  },
];
