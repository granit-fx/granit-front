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
        scope: 'documents',
        name: 'Contract',
        color: '#3B82F6',
        hideOnEntityCard: false,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: 'tag-doc-invoice',
        scope: 'documents',
        name: 'Invoice',
        color: '#10B981',
        hideOnEntityCard: false,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: 'tag-doc-internal',
        scope: 'documents',
        name: 'Internal',
        color: '#A855F7',
        hideOnEntityCard: true,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: 'tag-party-vip',
        scope: 'parties',
        name: 'VIP',
        color: '#F59E0B',
        hideOnEntityCard: false,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: 'tag-party-prospect',
        scope: 'parties',
        name: 'Prospect',
        color: '#EF4444',
        hideOnEntityCard: false,
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    categories: [
      {
        id: 'cat-doc-legal',
        scope: 'documents',
        parentId: null,
        path: '/legal',
        name: 'Legal',
        depth: 0,
        hasChildren: true,
      },
      {
        id: 'cat-doc-legal-contracts',
        scope: 'documents',
        parentId: 'cat-doc-legal',
        path: '/legal/contracts',
        name: 'Contracts',
        depth: 1,
        hasChildren: false,
      },
      {
        id: 'cat-doc-finance',
        scope: 'documents',
        parentId: null,
        path: '/finance',
        name: 'Finance',
        depth: 0,
        hasChildren: false,
      },
    ],
    tagAssignments: [],
    categoryAssignments: [],
  };
}
