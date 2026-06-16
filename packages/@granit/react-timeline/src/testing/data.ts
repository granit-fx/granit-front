import { TimelineEntryType } from '@granit/timeline';
import { toEntityId, toISODateString } from '@granit/types';

import type { Mutable } from '@granit/testing';
import type { TimelineStreamEntryResponse } from '@granit/timeline';

export const mockTimelineEntries: Mutable<TimelineStreamEntryResponse>[] = [
  {
    id: toEntityId<'TimelineStreamEntryResponse'>('tl-1'),
    entryType: TimelineEntryType.Comment,
    body: 'Account created and initial roles assigned.',
    authorId: toEntityId<'User'>('admin-001'),
    authorName: 'System Admin',
    parentEntryId: null,
    occurredAt: toISODateString('2025-12-15T09:30:00Z'),
    attachments: [],
  },
  {
    id: toEntityId<'TimelineStreamEntryResponse'>('tl-2'),
    entryType: TimelineEntryType.InternalNote,
    body: 'Reviewed user access — confirmed granit-showcase-admin role required for project onboarding.',
    authorId: toEntityId<'User'>('admin-002'),
    authorName: 'Security Officer',
    parentEntryId: null,
    occurredAt: toISODateString('2026-01-10T14:15:00Z'),
    attachments: [],
  },
  {
    id: toEntityId<'TimelineStreamEntryResponse'>('tl-3'),
    entryType: TimelineEntryType.SystemLog,
    body: 'Role granit-showcase-readonly removed by admin.',
    authorId: toEntityId<'User'>('system'),
    authorName: 'System',
    parentEntryId: null,
    occurredAt: toISODateString('2026-02-01T11:00:00Z'),
    attachments: [],
  },
];
