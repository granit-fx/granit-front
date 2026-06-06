import { created } from '@granit/testing/msw';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { createTaxonomyStore, type TaxonomyStore } from './data';

import type {
  CategoryResponse,
  CreateCategoryRequest,
  CreateTagRequest,
  MoveCategoryRequest,
  TagAssignmentRequest,
  TagResponse,
  TaxonomySearchResultGroup,
  UpdateCategoryRequest,
  UpdateTagRequest,
} from '@granit/taxonomy';

const store: TaxonomyStore = createTaxonomyStore();

const now = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

function wouldCreateCategoryCycle(nodeId: string, newParentId: string): boolean {
  const descendants = new Set<string>([nodeId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of store.categories) {
      if (c.parentId && descendants.has(c.parentId) && !descendants.has(c.id)) {
        descendants.add(c.id);
        grew = true;
      }
    }
  }
  return descendants.has(newParentId);
}

function recomputeHasChildren(scope: string, parentId: string | null): void {
  if (parentId === null) return;
  const parent = store.categories.find((c) => c.id === parentId && c.scope === scope);
  if (!parent) return;
  const stillHas = store.categories.some((c) => c.parentId === parentId && c.scope === scope);
  const idx = store.categories.indexOf(parent);
  store.categories[idx] = { ...parent, hasChildren: stillHas };
}

/**
 * Create stateful MSW handlers for the taxonomy endpoints (tags, categories,
 * assignments, cross-entity search). Handlers mutate an in-memory store —
 * mutations are reflected by subsequent GETs until the module is reloaded.
 *
 * @param baseUrl - API base path (default: `/api/v1/taxonomy`)
 */
export function createTaxonomyHandlers(baseUrl = DEFAULT_BASE_PATH) {
  return [
    // ─── Tags ───────────────────────────────────────────────────────────────
    http.get(`${baseUrl}/tags`, ({ request }) => {
      const url = new URL(request.url);
      const scope = url.searchParams.get('scope');
      const q = url.searchParams.get('q')?.toLowerCase();
      let tags = store.tags.filter((t) => t.scope === scope);
      if (q) tags = tags.filter((t) => t.name.toLowerCase().includes(q));
      return HttpResponse.json({ items: tags });
    }),
    http.post(`${baseUrl}/tags`, async ({ request }) => {
      const body = (await request.json()) as CreateTagRequest;
      const tag: TagResponse = {
        id: newId('tag'),
        scope: body.scope,
        name: body.name,
        color: body.color,
        hideOnEntityCard: body.hideOnEntityCard,
        createdAt: now(),
        updatedAt: now(),
      };
      store.tags.push(tag);
      return created(tag);
    }),
    http.patch(`${baseUrl}/tags/:id`, async ({ params, request }) => {
      const body = (await request.json()) as UpdateTagRequest;
      const idx = store.tags.findIndex((t) => t.id === params.id);
      const existing = idx === -1 ? undefined : store.tags[idx];
      if (!existing) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
      const next: TagResponse = { ...existing, ...body, updatedAt: now() };
      store.tags[idx] = next;
      return HttpResponse.json(next);
    }),
    http.delete(`${baseUrl}/tags/:id`, ({ params }) => {
      store.tags = store.tags.filter((t) => t.id !== params.id);
      store.tagAssignments = store.tagAssignments.filter((a) => a.tagId !== params.id);
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${baseUrl}/tags/:id/assign`, async ({ params, request }) => {
      const body = (await request.json()) as TagAssignmentRequest;
      const assignment = {
        tagId: params.id as string,
        targetType: body.targetType,
        targetId: body.targetId,
        assignedAt: now(),
      };
      store.tagAssignments = [
        ...store.tagAssignments.filter(
          (a) =>
            !(
              a.tagId === assignment.tagId &&
              a.targetType === assignment.targetType &&
              a.targetId === assignment.targetId
            )
        ),
        assignment,
      ];
      return created(assignment);
    }),
    http.delete(`${baseUrl}/tags/:id/assign/:targetType/:targetId`, ({ params }) => {
      store.tagAssignments = store.tagAssignments.filter(
        (a) =>
          !(
            a.tagId === params.id &&
            a.targetType === params.targetType &&
            a.targetId === params.targetId
          )
      );
      return new HttpResponse(null, { status: 204 });
    }),
    http.get(`${baseUrl}/tags/assignments`, ({ request }) => {
      const url = new URL(request.url);
      const targetType = url.searchParams.get('targetType');
      const targetId = url.searchParams.get('targetId');
      return HttpResponse.json(
        store.tagAssignments.filter((a) => a.targetType === targetType && a.targetId === targetId)
      );
    }),

    // ─── Categories ─────────────────────────────────────────────────────────
    http.get(`${baseUrl}/categories`, ({ request }) => {
      const url = new URL(request.url);
      const scope = url.searchParams.get('scope');
      const parentParam = url.searchParams.get('parentId');
      const parentId = parentParam ?? null;
      const items = store.categories.filter(
        (c) => c.scope === scope && (c.parentId ?? null) === parentId
      );
      return HttpResponse.json({ items });
    }),
    http.get(`${baseUrl}/categories/:id`, ({ params }) => {
      const cat = store.categories.find((c) => c.id === params.id);
      return cat
        ? HttpResponse.json(cat)
        : HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }),
    http.post(`${baseUrl}/categories`, async ({ request }) => {
      const body = (await request.json()) as CreateCategoryRequest;
      const parent = body.parentId
        ? store.categories.find((c) => c.id === body.parentId && c.scope === body.scope)
        : null;
      const cat: CategoryResponse = {
        id: newId('cat'),
        scope: body.scope,
        parentId: body.parentId,
        path: parent ? `${parent.path}/${body.name.toLowerCase()}` : `/${body.name.toLowerCase()}`,
        name: body.name,
        depth: parent ? parent.depth + 1 : 0,
        hasChildren: false,
      };
      store.categories.push(cat);
      recomputeHasChildren(body.scope, body.parentId);
      return created(cat);
    }),
    http.patch(`${baseUrl}/categories/:id`, async ({ params, request }) => {
      const body = (await request.json()) as UpdateCategoryRequest;
      const idx = store.categories.findIndex((c) => c.id === params.id);
      const existing = idx === -1 ? undefined : store.categories[idx];
      if (!existing) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
      const next: CategoryResponse = { ...existing, ...body };
      store.categories[idx] = next;
      return HttpResponse.json(next);
    }),
    http.post(`${baseUrl}/categories/:id/move`, async ({ params, request }) => {
      const body = (await request.json()) as MoveCategoryRequest;
      const idx = store.categories.findIndex((c) => c.id === params.id);
      const node = idx === -1 ? undefined : store.categories[idx];
      if (!node) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
      const newParent = body.newParentId
        ? store.categories.find((c) => c.id === body.newParentId)
        : null;
      // Cross-scope move: target parent exists in another scope.
      if (newParent && newParent.scope !== node.scope) {
        return HttpResponse.json({ detail: 'Cannot move across-scope.' }, { status: 422 });
      }
      // Cycle: refuse if the new parent is the node itself or one of its descendants.
      if (body.newParentId && wouldCreateCategoryCycle(node.id, body.newParentId)) {
        return HttpResponse.json({ detail: 'Cannot move: cycle detected.' }, { status: 422 });
      }
      const next: CategoryResponse = {
        ...node,
        parentId: body.newParentId,
        depth: newParent ? newParent.depth + 1 : 0,
        path: newParent
          ? `${newParent.path}/${node.name.toLowerCase()}`
          : `/${node.name.toLowerCase()}`,
      };
      store.categories[idx] = next;
      recomputeHasChildren(node.scope, node.parentId);
      recomputeHasChildren(node.scope, body.newParentId);
      return HttpResponse.json(next);
    }),
    http.delete(`${baseUrl}/categories/:id`, ({ params }) => {
      const cat = store.categories.find((c) => c.id === params.id);
      if (!cat) return new HttpResponse(null, { status: 204 });
      const hasDescendants = store.categories.some((c) => c.parentId === cat.id);
      if (hasDescendants) {
        // RFC 7807 problem-detail; the framework's CategoryTree matches the
        // `detail` keyword to map this to the localised error label.
        return HttpResponse.json(
          { detail: 'Cannot delete: this category has descendants.' },
          { status: 422 }
        );
      }
      const hasAssignments = store.categoryAssignments.some((a) => a.categoryId === cat.id);
      if (hasAssignments) {
        return HttpResponse.json(
          { detail: 'Cannot delete: this category has active assignments.' },
          { status: 422 }
        );
      }
      store.categories = store.categories.filter((c) => c.id !== cat.id);
      recomputeHasChildren(cat.scope, cat.parentId);
      return new HttpResponse(null, { status: 204 });
    }),

    // ─── Search (cross-entity) ──────────────────────────────────────────────
    http.get(`${baseUrl}/search`, () => {
      // Empty in mock mode — wire real result groups when entity stores are reachable.
      const groups: readonly TaxonomySearchResultGroup[] = [];
      return HttpResponse.json(groups);
    }),
  ];
}
