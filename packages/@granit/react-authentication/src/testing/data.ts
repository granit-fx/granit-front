import { toEntityId, toISODateString } from '@granit/types';

import type { BffSessionInfo } from '@granit/bff';

export const mockBffSessions: BffSessionInfo[] = [
  {
    sessionId: toEntityId<'BffSession'>('ab12...cd34'),
    isCurrent: true,
    createdAt: toISODateString('2026-03-23T08:15:00Z'),
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/134.0.0.0',
  },
  {
    sessionId: toEntityId<'BffSession'>('ef56...gh78'),
    isCurrent: false,
    createdAt: toISODateString('2026-03-22T14:30:00Z'),
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0) Safari/605.1.15',
  },
  {
    sessionId: toEntityId<'BffSession'>('ij90...kl12'),
    isCurrent: false,
    createdAt: toISODateString('2026-03-20T09:45:00Z'),
    userAgent: null,
  },
];
