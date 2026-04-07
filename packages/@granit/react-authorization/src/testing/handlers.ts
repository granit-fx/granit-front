import { noContent, notFound } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { mockPermissionGroups, mockRoleGrants } from './data.js';

/**
 * Create stateful MSW handlers for authorization endpoints (permission
 * definitions and role-based grants).
 *
 * @param baseUrl - API base path (default: `/api/v1/auth`)
 */
export function createAuthorizationHandlers(baseUrl = '/api/v1/auth') {
  return [
    // GET /definitions — list all permission groups
    http.get(`${baseUrl}/definitions`, () => {
      return HttpResponse.json(mockPermissionGroups);
    }),

    // GET /roles/:roleName — get grants for a role
    http.get(`${baseUrl}/roles/:roleName`, ({ params }) => {
      const roleName = params.roleName as string;
      const permissions = mockRoleGrants[roleName] ?? [];
      return HttpResponse.json({ roleName, permissions });
    }),

    // PUT /roles/:roleName/permissions/:permissionName — grant permission to role
    http.put(`${baseUrl}/roles/:roleName/permissions/:permissionName`, ({ params }) => {
      const roleName = params.roleName as string;
      const permissionName = params.permissionName as string;
      mockRoleGrants[roleName] ??= [];
      if (!mockRoleGrants[roleName].includes(permissionName)) {
        mockRoleGrants[roleName].push(permissionName);
      }
      return noContent();
    }),

    // DELETE /roles/:roleName/permissions/:permissionName — revoke permission from role
    http.delete(`${baseUrl}/roles/:roleName/permissions/:permissionName`, ({ params }) => {
      const roleName = params.roleName as string;
      const permissionName = params.permissionName as string;
      if (!mockRoleGrants[roleName]) return notFound();
      mockRoleGrants[roleName] = mockRoleGrants[roleName].filter((p) => p !== permissionName);
      return noContent();
    }),
  ];
}
