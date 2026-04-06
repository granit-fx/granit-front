import { toEntityId, toISODateString } from '@granit/types';

import type { TimelineEntry } from '@granit/timeline';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export const mockTimelineEntries: Mutable<TimelineEntry>[] = [
  {
    id: toEntityId<'TimelineEntry'>('tl-1'),
    entryType: 0,
    body: 'Account created and initial roles assigned.',
    authorId: toEntityId<'User'>('admin-001'),
    authorName: 'System Admin',
    parentEntryId: null,
    occurredAt: toISODateString('2025-12-15T09:30:00Z'),
    attachments: [],
  },
  {
    id: toEntityId<'TimelineEntry'>('tl-2'),
    entryType: 1,
    body: 'Reviewed user access — confirmed granit-showcase-admin role required for project onboarding.',
    authorId: toEntityId<'User'>('admin-002'),
    authorName: 'Security Officer',
    parentEntryId: null,
    occurredAt: toISODateString('2026-01-10T14:15:00Z'),
    attachments: [],
  },
  {
    id: toEntityId<'TimelineEntry'>('tl-3'),
    entryType: 2,
    body: 'Role granit-showcase-readonly removed by admin.',
    authorId: toEntityId<'User'>('system'),
    authorName: 'System',
    parentEntryId: null,
    occurredAt: toISODateString('2026-02-01T11:00:00Z'),
    attachments: [],
  },
];
