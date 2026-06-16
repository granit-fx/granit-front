import type {
  CategoryAssignmentResponse,
  CategoryResponse,
  TagAssignmentResponse,
  TagResponse,
} from '@granit/taxonomy';

/**
 * In-memory taxonomy store seeded with a small showcase dataset for
 * mock mode. The handlers in `./handlers.ts` mutate this object directly
 * so a session keeps its CRUD edits until the next page reload.
 */
export interface TaxonomyStore {
  tags: TagResponse[];
  categories: CategoryResponse[];
  tagAssignments: TagAssignmentResponse[];
  categoryAssignments: CategoryAssignmentResponse[];
}

const now = () => new Date().toISOString();

export function createTaxonomyStore(): TaxonomyStore {
  return {
    tags: [
      {
        id: 'tag-doc-contract',
        tenantId: null,
        scope: 'documents',
        name: 'Contract',
        color: '#3B82F6',
        hideOnEntityCard: false,
        createdAt: now(),
        modifiedAt: now(),
      },
      {
        id: 'tag-doc-invoice',
        tenantId: null,
        scope: 'documents',
        name: 'Invoice',
        color: '#10B981',
        hideOnEntityCard: false,
        createdAt: now(),
        modifiedAt: now(),
      },
      {
        id: 'tag-doc-internal',
        tenantId: null,
        scope: 'documents',
        name: 'Internal',
        color: '#A855F7',
        hideOnEntityCard: true,
        createdAt: now(),
        modifiedAt: now(),
      },
      {
        id: 'tag-party-vip',
        tenantId: null,
        scope: 'parties',
        name: 'VIP',
        color: '#F59E0B',
        hideOnEntityCard: false,
        createdAt: now(),
        modifiedAt: now(),
      },
      {
        id: 'tag-party-prospect',
        tenantId: null,
        scope: 'parties',
        name: 'Prospect',
        color: '#EF4444',
        hideOnEntityCard: false,
        createdAt: now(),
        modifiedAt: now(),
      },
    ],
    categories: [
      {
        id: 'cat-doc-legal',
        tenantId: null,
        scope: 'documents',
        parentId: null,
        path: '/legal',
        name: 'Legal',
        depth: 0,
        iconName: null,
        hideOnEntityCard: false,
        hasChildren: true,
      },
      {
        id: 'cat-doc-legal-contracts',
        tenantId: null,
        scope: 'documents',
        parentId: 'cat-doc-legal',
        path: '/legal/contracts',
        name: 'Contracts',
        depth: 1,
        iconName: null,
        hideOnEntityCard: false,
        hasChildren: false,
      },
      {
        id: 'cat-doc-finance',
        tenantId: null,
        scope: 'documents',
        parentId: null,
        path: '/finance',
        name: 'Finance',
        depth: 0,
        iconName: null,
        hideOnEntityCard: false,
        hasChildren: false,
      },
    ],
    tagAssignments: [],
    categoryAssignments: [],
  };
}
