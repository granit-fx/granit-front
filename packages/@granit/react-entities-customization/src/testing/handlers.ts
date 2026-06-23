import { noContent, notFound } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_API_BASE } from '../constants';

import { mockEntityCustomization, mockWorkspaceCustomization } from './data';

import type {
  EntityCustomizationRequest,
  EntityCustomizationResponse,
  WorkspaceCustomizationRequest,
  WorkspaceCustomizationResponse,
} from '@granit/entities-customization';

/**
 * Create stateful MSW handlers for the entity-customization endpoints.
 *
 * Covers `GET|PUT|DELETE {apiBase}/entities/{name}/customization/{layoutKind}`.
 * PUT echoes the submitted deltas; DELETE resets to the base layout (empty deltas).
 *
 * @param apiBase - API root without trailing slash (default: `/api/v1`)
 */
export function createEntityCustomizationHandlers(apiBase = DEFAULT_API_BASE) {
  let current: EntityCustomizationResponse = { ...mockEntityCustomization };
  const url = `${apiBase}/entities/:entityName/customization/:layoutKind`;

  return [
    http.get(url, ({ params }) =>
      HttpResponse.json<EntityCustomizationResponse>({
        ...current,
        entityName: String(params.entityName),
        layoutKind: current.layoutKind,
      })
    ),

    http.put(url, async ({ request, params }) => {
      const body = (await request.json()) as EntityCustomizationRequest;
      current = {
        ...current,
        entityName: String(params.entityName),
        deltas: body.deltas,
      };
      return HttpResponse.json<EntityCustomizationResponse>(current);
    }),

    http.delete(url, () => {
      current = { ...current, deltas: [] };
      return noContent();
    }),
  ];
}

/**
 * Create stateful MSW handlers for the workspace-customization endpoints.
 *
 * Covers `GET|PUT {apiBase}/workspaces/{name}/customization`.
 * PUT echoes the submitted deltas and stamps `updatedAt`/`updatedByUserId`.
 *
 * @param apiBase - API root without trailing slash (default: `/api/v1`)
 */
export function createWorkspaceCustomizationHandlers(apiBase = DEFAULT_API_BASE) {
  let current: WorkspaceCustomizationResponse = { ...mockWorkspaceCustomization };
  const url = `${apiBase}/workspaces/:workspaceName/customization`;

  return [
    http.get(url, ({ params }) => {
      const workspaceName = String(params.workspaceName);
      if (workspaceName.length === 0) return notFound();
      return HttpResponse.json<WorkspaceCustomizationResponse>({
        ...current,
        workspaceName,
      });
    }),

    http.put(url, async ({ request, params }) => {
      const body = (await request.json()) as WorkspaceCustomizationRequest;
      current = {
        ...current,
        workspaceName: String(params.workspaceName),
        deltas: body.deltas,
      };
      return HttpResponse.json<WorkspaceCustomizationResponse>(current);
    }),
  ];
}
