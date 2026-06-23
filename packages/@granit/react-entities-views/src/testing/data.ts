import type {
  EntityViewCreateBodyRequest,
  EntityViewResponse,
  EntityViewShareBodyRequest,
  EntityViewUpdateBodyRequest,
} from '@granit/entities-views';
import type { Mutable } from '@granit/testing';

/** Wire identifier of the entity every fixture below targets. */
export const SAMPLE_ENTITY_NAME = 'Granit.Parties.Party';

/**
 * A Personal saved view starred as the caller's personal default — the
 * shape the list / single / default endpoints return for an owner.
 */
export const mockPersonalView: Mutable<EntityViewResponse> = {
  id: '8c6b1e10-0000-4000-8000-000000000001',
  entityName: SAMPLE_ENTITY_NAME,
  basedOn: 'default',
  kind: 'list',
  name: 'My open parties',
  description: null,
  icon: null,
  state: { filters: [] },
  visibility: 'Personal',
  ownerId: '00000000-0000-0000-0000-000000000001',
  sharedWith: null,
  isPinned: false,
  isDefault: false,
  isPersonalDefault: true,
  sortOrder: 0,
};

/** A Tenant view promoted to the tenant default (owner-less). */
export const mockTenantView: Mutable<EntityViewResponse> = {
  id: '8c6b1e10-0000-4000-8000-000000000002',
  entityName: SAMPLE_ENTITY_NAME,
  basedOn: 'default',
  kind: 'list',
  name: 'Tenant overdue',
  description: null,
  icon: null,
  state: { filters: [] },
  visibility: 'Tenant',
  ownerId: null,
  sharedWith: null,
  isPinned: false,
  isDefault: true,
  isPersonalDefault: false,
  sortOrder: 10,
};

/** A Shared view targeted at a role — exercises the `sharedWith` audience shape. */
export const mockSharedView: Mutable<EntityViewResponse> = {
  id: '8c6b1e10-0000-4000-8000-000000000003',
  entityName: SAMPLE_ENTITY_NAME,
  basedOn: 'default',
  kind: 'list',
  name: 'Team backlog',
  description: 'Shared with the operations team',
  icon: 'users',
  state: { filters: [], sort: '-createdAt' },
  visibility: 'Shared',
  ownerId: '00000000-0000-0000-0000-000000000001',
  sharedWith: { roles: ['admin'], users: [] },
  isPinned: true,
  isDefault: false,
  isPersonalDefault: false,
  sortOrder: 20,
};

/** The full accessible list for {@link SAMPLE_ENTITY_NAME}, sorted by `sortOrder`. */
export const mockEntityViews: Mutable<EntityViewResponse>[] = [
  mockPersonalView,
  mockTenantView,
  mockSharedView,
];

/** Sample create body — mirrors `useCreateEntityView().mutateAsync(...)` input. */
export const sampleCreateRequest: EntityViewCreateBodyRequest = {
  basedOn: 'default',
  kind: 'list',
  name: 'My open parties',
  description: null,
  icon: null,
  state: { filters: [] },
};

/** Sample update body — mirrors `useUpdateEntityView().mutateAsync(...)` input. */
export const sampleUpdateRequest: EntityViewUpdateBodyRequest = {
  name: 'Renamed',
  description: null,
  icon: null,
  state: { filters: [] },
};

/** Sample share body — promotes a Personal view to Shared with the `admin` role. */
export const sampleShareRequest: EntityViewShareBodyRequest = {
  roles: ['admin'],
  users: [],
};
