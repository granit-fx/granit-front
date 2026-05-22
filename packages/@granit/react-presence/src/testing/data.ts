import { toEntityId, toISODateString } from '@granit/types';

import type { PresenceResponse } from '@granit/presence';
import type { UserId } from '@granit/types';

const baseLastSeen = toISODateString('2026-05-22T10:00:00Z');

export const mockUsers = [
  { id: toEntityId<'User'>('user-self') as UserId, name: 'Your Account' },
  { id: toEntityId<'User'>('user-alice') as UserId, name: 'Alice Martin' },
  { id: toEntityId<'User'>('user-bob') as UserId, name: 'Bob Lefebvre' },
  { id: toEntityId<'User'>('user-charlie') as UserId, name: 'Charlie Wood' },
  { id: toEntityId<'User'>('user-diana') as UserId, name: 'Diana Brown' },
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
