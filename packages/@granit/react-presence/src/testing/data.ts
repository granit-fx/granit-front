import { toEntityId, toISODateString } from '@granit/types';

import type { PresenceResponse } from '@granit/presence';
import type { UserId } from '@granit/types';

const baseLastSeen = toISODateString('2026-05-22T10:00:00Z');

// Stable GUIDs — the backend deserializes UserId as System.Guid, so the
// mocks must use Guid-formatted strings to round-trip through both MSW
// and the real .NET stack.
//
// `self` aligns with the first user in @granit/react-identity/testing
// (marie.dupont) so demos that mount both providers stay coherent.
export const mockUsers = [
  {
    id: toEntityId<'User'>('d2c47314-4d08-4952-98b1-a1b8a6e22ef1') as UserId,
    name: 'Your Account',
  },
  {
    id: toEntityId<'User'>('0a1b2c3d-1111-4111-8111-aaaaaaaaaaaa') as UserId,
    name: 'Alice Martin',
  },
  {
    id: toEntityId<'User'>('0a1b2c3d-2222-4222-8222-bbbbbbbbbbbb') as UserId,
    name: 'Bob Lefebvre',
  },
  {
    id: toEntityId<'User'>('0a1b2c3d-3333-4333-8333-cccccccccccc') as UserId,
    name: 'Charlie Wood',
  },
  { id: toEntityId<'User'>('0a1b2c3d-4444-4444-8444-dddddddddddd') as UserId, name: 'Diana Brown' },
];

export const mockMyPresence: PresenceResponse = {
  userId: mockUsers[0]!.id,
  effectiveStatus: 'Online',
  manualOverride: null,
  overrideUntilUtc: null,
  lastSeenUtc: baseLastSeen,
};

export const mockOtherPresences: Record<string, PresenceResponse> = {
  [mockUsers[1]!.id]: {
    userId: mockUsers[1]!.id,
    effectiveStatus: 'Online',
    manualOverride: null,
    overrideUntilUtc: null,
    lastSeenUtc: baseLastSeen,
  },
  [mockUsers[2]!.id]: {
    userId: mockUsers[2]!.id,
    effectiveStatus: 'Away',
    manualOverride: null,
    overrideUntilUtc: null,
    lastSeenUtc: toISODateString('2026-05-22T09:50:00Z'),
  },
  [mockUsers[3]!.id]: {
    userId: mockUsers[3]!.id,
    effectiveStatus: 'DoNotDisturb',
    manualOverride: 'DoNotDisturb',
    overrideUntilUtc: toISODateString('2026-05-22T18:00:00Z'),
    lastSeenUtc: toISODateString('2026-05-22T09:55:00Z'),
  },
  [mockUsers[4]!.id]: {
    userId: mockUsers[4]!.id,
    effectiveStatus: 'Offline',
    manualOverride: null,
    overrideUntilUtc: null,
    lastSeenUtc: toISODateString('2026-05-21T18:00:00Z'),
  },
};
