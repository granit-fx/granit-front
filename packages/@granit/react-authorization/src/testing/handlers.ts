import { noContent, notFound } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import {
  mockPermissionGrants,
  mockPermissionGroups,
  mockRoleGrants,
  mockRoleMetadata,
} from './data';

/**
 * Create stateful MSW handlers for authorization endpoints (permission
 * definitions and role-based grants).
 *
 * @param baseUrl - API base path (default: `/api/v1/authorization`)
 */
export function createAuthorizationHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    // GET /permissions/definitions — list all permission groups
    http.get(`${baseUrl}/permissions/definitions`, () => {
      return HttpResponse.json(mockPermissionGroups);
    }),

    // GET /roles/:roleName — get grants for a role
    http.get(`${baseUrl}/roles/:roleName`, ({ params }) => {
      const roleName = params.roleName as string;
      const permissions = mockRoleGrants[roleName] ?? [];
      return HttpResponse.json({ roleName, permissions });
    }),

    // PUT /roles/:roleName/:permissionName — grant permission to role
    http.put(`${baseUrl}/roles/:roleName/:permissionName`, ({ params }) => {
      const roleName = params.roleName as string;
      const permissionName = params.permissionName as string;
      mockRoleGrants[roleName] ??= [];
      if (!mockRoleGrants[roleName].includes(permissionName)) {
        mockRoleGrants[roleName].push(permissionName);
      }
      return noContent();
    }),

    // DELETE /roles/:roleName/:permissionName — revoke permission from role
    http.delete(`${baseUrl}/roles/:roleName/:permissionName`, ({ params }) => {
      const roleName = params.roleName as string;
      const permissionName = params.permissionName as string;
      if (!mockRoleGrants[roleName]) return notFound();
      mockRoleGrants[roleName] = mockRoleGrants[roleName].filter((p) => p !== permissionName);
      return noContent();
    }),

    // GET /grants — paginated permission grants query surface
    http.get(`${baseUrl}/grants`, () => {
      return HttpResponse.json({
        items: mockPermissionGrants,
        totalCount: mockPermissionGrants.length,
        hasMore: false,
        nextCursor: null,
      });
    }),

    // GET /grants/meta — query metadata for the permission grants surface
    http.get(`${baseUrl}/grants/meta`, () => {
      return HttpResponse.json(emptyQueryMetadata());
    }),

    // GET /role-metadata — paginated role metadata query surface
    http.get(`${baseUrl}/role-metadata`, () => {
      return HttpResponse.json({
        items: mockRoleMetadata,
        totalCount: mockRoleMetadata.length,
        hasMore: false,
        nextCursor: null,
      });
    }),

    // GET /role-metadata/meta — query metadata for the role metadata surface
    http.get(`${baseUrl}/role-metadata/meta`, () => {
      return HttpResponse.json(emptyQueryMetadata());
    }),
  ];
}

/** Minimal, structurally-valid {@link QueryMetadata} placeholder for mock query surfaces. */
function emptyQueryMetadata() {
  return {
    columns: [],
    filterableFields: [],
    sortableFields: [],
    presetFilterGroups: [],
    quickFilters: [],
    dateFilters: [],
    groupByFields: [],
    pagination: { defaultPageSize: 20, maxPageSize: 100, pageSizeOptions: [20, 50, 100] },
  };
}
