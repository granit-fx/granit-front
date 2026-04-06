import type { AdminTenant } from '@granit/multi-tenancy';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export const mockTenants: Mutable<AdminTenant>[] = [
  {
    id: 'tnt_01HZ9KQX0000000000001' as AdminTenant['id'],
    name: 'Acme Corporation',
    identifier: 'acme',
    contactEmail: 'admin@acme.example',
    isActive: true,
    jurisdiction: 'BE',
    createdAt: '2025-09-01T00:00:00Z',
  },
  {
    id: 'tnt_01HZ9KQX0000000000002' as AdminTenant['id'],
    name: 'Globex Industries',
    identifier: 'globex',
    contactEmail: 'it@globex.example',
    isActive: true,
    jurisdiction: 'FR',
    createdAt: '2025-11-15T00:00:00Z',
  },
  {
    id: 'tnt_01HZ9KQX0000000000003' as AdminTenant['id'],
    name: 'Initech',
    identifier: 'initech',
    contactEmail: null,
    isActive: false,
    jurisdiction: null,
    createdAt: '2026-01-20T00:00:00Z',
  },
];
