import { notFound, pagedResponse } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants.js';

import { mockAuditEntries } from './data.js';

import type { AuditEntry, AuditEntryDetail } from '@granit/auditing';

/**
 * Create stateful MSW handlers for audit log endpoints.
 *
 * @param baseUrl - API base path (default: `/api/v1/auditing`)
 */
export function createAuditHandlers(baseUrl = DEFAULT_BASE_PATH) {
  const auditEntriesUrl = `${baseUrl}/audit-entries`;
  return [
    // GET list — filtered, sorted newest-first, paginated
    http.get(auditEntriesUrl, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
      const category = url.searchParams.get('category');

      let filtered: AuditEntry[] = [...mockAuditEntries];

      if (category) {
        filtered = filtered.filter((e) => e.category === category);
      }

      // Default sort: newest first
      filtered.sort((a, b) => (b.timestamp as string).localeCompare(a.timestamp as string));

      const start = (page - 1) * pageSize;
      return pagedResponse<AuditEntry>(filtered.slice(start, start + pageSize), filtered.length);
    }),

    // GET single entry detail
    http.get(`${auditEntriesUrl}/:id`, ({ params }) => {
      const entry = mockAuditEntries.find((e) => e.id === params.id);
      if (!entry) return notFound();

      const detail: AuditEntryDetail = {
        ...entry,
        entityChanges: [
          {
            entityType: 'User',
            entityId: 'user-001',
            changeType: 'Modified',
            propertyChanges: [
              { propertyName: 'email', originalValue: 'old@test.com', newValue: 'new@test.com' },
            ],
          },
        ],
      };
      return HttpResponse.json(detail);
    }),
  ];
}
