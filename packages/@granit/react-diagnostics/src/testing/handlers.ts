import { http, HttpResponse } from 'msw';

import { mockDiagnosticsHealth } from './data.js';

/**
 * Create MSW handlers for diagnostics health endpoints.
 * The `checkedAt` field is updated to the current time on each request
 * to simulate a live health check.
 *
 * @param baseUrl - API base path (default: `/api/v1/diagnostics`)
 */
export function createDiagnosticsHandlers(baseUrl = '/api/v1/diagnostics') {
  return [
    http.get(`${baseUrl}/health`, () => {
      return HttpResponse.json({
        ...mockDiagnosticsHealth,
        checkedAt: new Date().toISOString(),
      });
    }),
  ];
}
