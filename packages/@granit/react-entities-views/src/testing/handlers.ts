import { noContent, notFound } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { mockEntityViews, SAMPLE_ENTITY_NAME } from './data';

import type {
  EntityViewCreateBodyRequest,
  EntityViewResponse,
  EntityViewShareBodyRequest,
  EntityViewToggleFlagRequest,
  EntityViewUpdateBodyRequest,
} from '@granit/entities-views';

/** Default `entities` base path — matches the `ENTITIES_BASE_PATH` the hooks use. */
export const DEFAULT_BASE_PATH = '/api/v1/entities';

interface CreateEntityViewHandlersOptions {
  /** API base path (default: `/api/v1/entities`). */
  readonly baseUrl?: string;
  /** Entity wire identifier to scope the handlers to (default: `Granit.Parties.Party`). */
  readonly entityName?: string;
  /** Seed views (default: {@link mockEntityViews}). */
  readonly views?: readonly EntityViewResponse[];
}

/**
 * Create stateful MSW handlers for the EntityView CRUD + flag endpoints.
 *
 * Backs the list / single / default reads and the create / update / delete /
 * pin / star / set-default / share mutations against an in-memory store seeded
 * from {@link mockEntityViews}. Mirrors
 * `Granit.Entities.Views.Endpoints.EntityViewsEndpoints`.
 */
export function createEntityViewHandlers(options: CreateEntityViewHandlersOptions = {}) {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_PATH;
  const entityName = options.entityName ?? SAMPLE_ENTITY_NAME;
  const store: EntityViewResponse[] = [...(options.views ?? mockEntityViews)];

  const viewsRoot = `${baseUrl}/${encodeURIComponent(entityName)}/views`;
  const find = (id: unknown): EntityViewResponse | undefined =>
    store.find((view) => view.id === id);
  const sorted = (): EntityViewResponse[] =>
    [...store].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  return [
    // GET /views — accessible list, sorted by sortOrder then name
    http.get(viewsRoot, () => HttpResponse.json(sorted())),

    // GET /views/_default — resolved default, or 204 when none
    http.get(`${viewsRoot}/_default`, () => {
      const fallback =
        store.find((view) => view.isPersonalDefault) ?? store.find((view) => view.isDefault);
      return fallback ? HttpResponse.json(fallback) : noContent();
    }),

    // POST /views — create a Personal view owned by the caller (201)
    http.post(viewsRoot, async ({ request }) => {
      const body = (await request.json()) as EntityViewCreateBodyRequest;
      const created: EntityViewResponse = {
        id: `view-${store.length + 1}`,
        entityName,
        basedOn: body.basedOn,
        kind: body.kind,
        name: body.name,
        description: body.description,
        icon: body.icon,
        state: body.state,
        visibility: 'Personal',
        ownerId: '00000000-0000-0000-0000-000000000001',
        sharedWith: null,
        isPinned: false,
        isDefault: false,
        isPersonalDefault: false,
        sortOrder: store.length,
      };
      store.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),

    // PUT /views/:id — update editable fields
    http.put(`${viewsRoot}/:id`, async ({ params, request }) => {
      const view = find(params.id);
      if (!view) return notFound();
      const body = (await request.json()) as EntityViewUpdateBodyRequest;
      const updated: EntityViewResponse = {
        ...view,
        name: body.name,
        description: body.description,
        icon: body.icon,
        state: body.state,
      };
      store.splice(store.indexOf(view), 1, updated);
      return HttpResponse.json(updated);
    }),

    // DELETE /views/:id — remove a view (204)
    http.delete(`${viewsRoot}/:id`, ({ params }) => {
      const view = find(params.id);
      if (!view) return notFound();
      store.splice(store.indexOf(view), 1);
      return noContent();
    }),

    // POST /views/:id/pin — toggle pinned-as-tab
    http.post(`${viewsRoot}/:id/pin`, async ({ params, request }) => {
      const view = find(params.id);
      if (!view) return notFound();
      const { value } = (await request.json()) as EntityViewToggleFlagRequest;
      const updated: EntityViewResponse = { ...view, isPinned: value };
      store.splice(store.indexOf(view), 1, updated);
      return HttpResponse.json(updated);
    }),

    // POST /views/:id/set-default — toggle tenant default
    http.post(`${viewsRoot}/:id/set-default`, async ({ params, request }) => {
      const view = find(params.id);
      if (!view) return notFound();
      const { value } = (await request.json()) as EntityViewToggleFlagRequest;
      const updated: EntityViewResponse = { ...view, isDefault: value };
      store.splice(store.indexOf(view), 1, updated);
      return HttpResponse.json(updated);
    }),

    // POST /views/:id/star — toggle personal default
    http.post(`${viewsRoot}/:id/star`, async ({ params, request }) => {
      const view = find(params.id);
      if (!view) return notFound();
      const { value } = (await request.json()) as EntityViewToggleFlagRequest;
      const updated: EntityViewResponse = { ...view, isPersonalDefault: value };
      store.splice(store.indexOf(view), 1, updated);
      return HttpResponse.json(updated);
    }),

    // POST /views/:id/share — promote to Shared / update audience
    http.post(`${viewsRoot}/:id/share`, async ({ params, request }) => {
      const view = find(params.id);
      if (!view) return notFound();
      const body = (await request.json()) as EntityViewShareBodyRequest;
      const updated: EntityViewResponse = {
        ...view,
        visibility: 'Shared',
        sharedWith: { roles: body.roles, users: body.users },
      };
      store.splice(store.indexOf(view), 1, updated);
      return HttpResponse.json(updated);
    }),
  ];
}
