import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockDiagnosticsHealth } from './data';

/**
 * Create MSW handlers for diagnostics health endpoints.
 * The `checkedAt` field is updated to the current time on each request
 * to simulate a live health check.
 *
 * @param baseUrl - API base path (default: `/api/v1/diagnostics`)
 */
export function createDiagnosticsHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    http.get(`${baseUrl}/health`, () => {
      return HttpResponse.json({
        ...mockDiagnosticsHealth,
        checkedAt: new Date().toISOString(),
      });
    }),
  ];
}
