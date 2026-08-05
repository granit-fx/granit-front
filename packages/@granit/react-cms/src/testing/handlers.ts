// ---------------------------------------------------------------------------
// @granit/react-cms/testing — MSW handler factories
//
// Each factory takes the collection base URL and returns in-memory handlers
// seeded from the fixtures. Consumers wire the base to their API origin, e.g.
// `createSitesHandlers(`${apiUrl}/api/cms/sites`)`.
// ---------------------------------------------------------------------------

import { toISODateString } from '@granit/types';
import { http, HttpResponse, type RequestHandler } from 'msw';

import { CORPORATE_SITE_ID, mockMenus, mockPageTree, mockReleases, mockSites } from './data';

import type {
  MenuCreateRequest,
  CreatePageRequest,
  CreateReleaseRequest,
  CreateSiteRequest,
  MenuItemResponse,
  MenuResponse,
  PageResponse,
  PageTreeNodeResponse,
  ReleaseResponse,
  ScheduleReleaseRequest,
  SetSiteHomePageRequest,
  SiteResponse,
  MenuUpdateRequest,
  RenamePageRequest,
  UpdateSiteRequest,
} from '@granit/cms';
import type { PagedResult } from '@granit/query-engine';

const notFound = () => new HttpResponse(null, { status: 404 });

function paged<T>(items: readonly T[], page: number, pageSize: number): PagedResult<T> {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalCount: items.length,
    hasMore: start + pageSize < items.length,
    nextCursor: null,
  };
}

/** Sites handlers (`/api/cms/sites`) — list/detail/create/update/delete. */
export function createSitesHandlers(baseUrl = '/api/cms/sites'): RequestHandler[] {
  const sites: SiteResponse[] = mockSites.map((site) => ({ ...site }));

  return [
    http.get(baseUrl, ({ request }) => {
      const url = new URL(request.url);
      const search = url.searchParams.get('search')?.toLowerCase();
      const page = Number(url.searchParams.get('page') ?? '1');
      const pageSize = Number(url.searchParams.get('pageSize') ?? '20');
      const filtered = search
        ? sites.filter(
            (site) =>
              site.slug.toLowerCase().includes(search) ||
              Object.values(site.displayNames).some((name) => name.toLowerCase().includes(search))
          )
        : sites;
      return HttpResponse.json(paged(filtered, page, pageSize));
    }),

    http.get(`${baseUrl}/:id`, ({ params }) => {
      const site = sites.find((candidate) => candidate.id === params.id);
      return site ? HttpResponse.json(site) : notFound();
    }),

    http.post(baseUrl, async ({ request }) => {
      const dto = (await request.json()) as CreateSiteRequest;
      const site: SiteResponse = {
        id: crypto.randomUUID(),
        slug: dto.slug,
        defaultCulture: dto.defaultCulture,
        allowedCultures: [...dto.allowedCultures],
        domains: dto.domains ? [...dto.domains] : [],
        defaultTheme: dto.defaultTheme ?? 'granit',
        activated: true,
        tenantId: null,
        displayNames: { [dto.defaultCulture]: dto.slug },
        homePageId: null,
        createdAt: toISODateString('2026-01-01T00:00:00Z'),
        modifiedAt: null,
      };
      sites.push(site);
      return HttpResponse.json(site, { status: 201 });
    }),

    http.put(`${baseUrl}/:id`, async ({ params, request }) => {
      const existing = sites.find((candidate) => candidate.id === params.id);
      if (!existing) return notFound();
      const dto = (await request.json()) as UpdateSiteRequest;
      const updated: SiteResponse = {
        ...existing,
        defaultCulture: dto.defaultCulture,
        allowedCultures: [...dto.allowedCultures],
        domains: [...dto.domains],
        defaultTheme: dto.defaultTheme,
        activated: dto.activated,
      };
      sites[sites.indexOf(existing)] = updated;
      return HttpResponse.json(updated);
    }),

    http.delete(`${baseUrl}/:id`, ({ params }) => {
      const existing = sites.find((candidate) => candidate.id === params.id);
      if (!existing) return notFound();
      sites.splice(sites.indexOf(existing), 1);
      return new HttpResponse(null, { status: 204 });
    }),

    http.put(`${baseUrl}/:id/home-page`, async ({ params, request }) => {
      const existing = sites.find((candidate) => candidate.id === params.id);
      if (!existing) return notFound();
      const dto = (await request.json()) as SetSiteHomePageRequest;
      const updated: SiteResponse = { ...existing, homePageId: dto.pageId };
      sites[sites.indexOf(existing)] = updated;
      return HttpResponse.json(updated);
    }),

    http.delete(`${baseUrl}/:id/home-page`, ({ params }) => {
      const existing = sites.find((candidate) => candidate.id === params.id);
      if (!existing) return notFound();
      const updated: SiteResponse = { ...existing, homePageId: null };
      sites[sites.indexOf(existing)] = updated;
      return HttpResponse.json(updated);
    }),
  ];
}

type StoredNode = PageTreeNodeResponse & { readonly siteId: string };

/** Pages handlers (`/api/cms/pages`) — tree (bare array)/detail/create/update/delete. */
export function createPagesHandlers(baseUrl = '/api/cms/pages'): RequestHandler[] {
  const nodes: StoredNode[] = mockPageTree.map((node) => ({ ...node, siteId: CORPORATE_SITE_ID }));

  const toTreeNode = ({ siteId: _siteId, ...node }: StoredNode): PageTreeNodeResponse => node;
  const toPageResponse = (node: StoredNode): PageResponse => ({
    id: node.id,
    siteId: node.siteId,
    parentId: node.parentId,
    slugSegment: node.slugSegment,
    structurePath: node.structurePath,
    depth: node.depth,
    kind: 'content',
    isSiteRoot: node.isSiteRoot,
    layoutKey: null,
    translations: [],
    createdAt: toISODateString('2026-01-01T00:00:00Z'),
    modifiedAt: null,
    concurrencyStamp: 'mock-stamp',
  });

  return [
    http.get(`${baseUrl}/tree`, ({ request }) => {
      const siteId = request.headers.get('X-Granit-Site');
      const tree = (siteId ? nodes.filter((node) => node.siteId === siteId) : nodes).map(
        toTreeNode
      );
      return HttpResponse.json(tree);
    }),

    http.get(`${baseUrl}/:id`, ({ params }) => {
      const node = nodes.find((candidate) => candidate.id === params.id);
      return node ? HttpResponse.json(toPageResponse(node)) : notFound();
    }),

    http.post(baseUrl, async ({ request }) => {
      const dto = (await request.json()) as CreatePageRequest;
      const parent = nodes.find((node) => node.id === dto.parentId);
      if (!parent) return notFound();
      const created: StoredNode = {
        id: crypto.randomUUID(),
        // Site is inherited from the parent (the real backend does the same).
        siteId: parent.siteId,
        parentId: dto.parentId,
        slugSegment: dto.slugSegment,
        structurePath: `${parent.isSiteRoot ? '' : parent.structurePath}/${dto.slugSegment}`,
        depth: parent.depth + 1,
        isSiteRoot: false,
      };
      nodes.push(created);
      return HttpResponse.json(toPageResponse(created), { status: 201 });
    }),

    http.put(`${baseUrl}/:id`, async ({ params, request }) => {
      const existing = nodes.find((node) => node.id === params.id);
      if (!existing) return notFound();
      const dto = (await request.json()) as RenamePageRequest;
      const updated: StoredNode = { ...existing, slugSegment: dto.slugSegment };
      nodes[nodes.indexOf(existing)] = updated;
      return HttpResponse.json(toPageResponse(updated));
    }),

    http.delete(`${baseUrl}/:id`, ({ params }) => {
      const existing = nodes.find((node) => node.id === params.id);
      if (!existing) return notFound();
      nodes.splice(nodes.indexOf(existing), 1);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

function toMenuItems(
  items: MenuCreateRequest['items'] | MenuUpdateRequest['items']
): MenuItemResponse[] {
  return (items ?? []).map((item) => ({
    label: item.label,
    kind: item.kind,
    pageId: item.pageId ?? null,
    url: item.url ?? null,
    anchor: item.anchor ?? null,
    isVisible: item.isVisible ?? true,
    icon: item.icon ?? null,
    cssClass: item.cssClass ?? null,
    children: toMenuItems(item.children),
  }));
}

/** Menus handlers (`/api/cms/menus`) — list (paged)/detail/create/update/delete. */
export function createMenusHandlers(baseUrl = '/api/cms/menus'): RequestHandler[] {
  const menus: MenuResponse[] = mockMenus.map((menu) => ({ ...menu }));

  return [
    http.get(baseUrl, ({ request }) => {
      const url = new URL(request.url);
      const siteId = url.searchParams.get('siteId');
      const page = Number(url.searchParams.get('page') ?? '1');
      const pageSize = Number(url.searchParams.get('pageSize') ?? '20');
      const filtered = siteId ? menus.filter((menu) => menu.siteId === siteId) : menus;
      return HttpResponse.json(paged(filtered, page, pageSize));
    }),

    http.get(`${baseUrl}/:id`, ({ params }) => {
      const menu = menus.find((candidate) => candidate.id === params.id);
      return menu ? HttpResponse.json(menu) : notFound();
    }),

    http.post(baseUrl, async ({ request }) => {
      const dto = (await request.json()) as MenuCreateRequest;
      const menu: MenuResponse = {
        id: crypto.randomUUID(),
        siteId: dto.siteId,
        key: dto.key,
        title: dto.title,
        items: toMenuItems(dto.items),
        createdAt: toISODateString('2026-01-01T00:00:00Z'),
        modifiedAt: null,
      };
      menus.push(menu);
      return HttpResponse.json(menu, { status: 201 });
    }),

    http.put(`${baseUrl}/:id`, async ({ params, request }) => {
      const existing = menus.find((candidate) => candidate.id === params.id);
      if (!existing) return notFound();
      const dto = (await request.json()) as MenuUpdateRequest;
      const updated: MenuResponse = {
        ...existing,
        title: dto.title,
        items: toMenuItems(dto.items),
      };
      menus[menus.indexOf(existing)] = updated;
      return HttpResponse.json(updated);
    }),

    http.delete(`${baseUrl}/:id`, ({ params }) => {
      const existing = menus.find((candidate) => candidate.id === params.id);
      if (!existing) return notFound();
      menus.splice(menus.indexOf(existing), 1);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

/** Releases handlers (`/api/cms/releases`) — list/detail/create/publish/schedule/cancel. */
export function createReleasesHandlers(baseUrl = '/api/cms/releases'): RequestHandler[] {
  const releases: ReleaseResponse[] = mockReleases.map((release) => ({ ...release }));

  return [
    http.get(baseUrl, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? '1');
      const pageSize = Number(url.searchParams.get('pageSize') ?? '20');
      return HttpResponse.json(paged(releases, page, pageSize));
    }),

    http.get(`${baseUrl}/:id`, ({ params }) => {
      const release = releases.find((candidate) => candidate.id === params.id);
      return release ? HttpResponse.json(release) : notFound();
    }),

    http.post(baseUrl, async ({ request }) => {
      const dto = (await request.json()) as CreateReleaseRequest;
      const release: ReleaseResponse = {
        id: crypto.randomUUID(),
        name: dto.name,
        status: 'Draft',
        schedule: null,
        tenantId: null,
        actions: [],
        createdAt: toISODateString('2026-01-01T00:00:00Z'),
        modifiedAt: null,
        concurrencyStamp: crypto.randomUUID(),
      };
      releases.push(release);
      return HttpResponse.json(release, { status: 201 });
    }),

    http.post(`${baseUrl}/:id/publish`, ({ params }) => {
      const existing = releases.find((candidate) => candidate.id === params.id);
      if (!existing) return notFound();
      const updated: ReleaseResponse = {
        ...existing,
        status: 'Done',
        actions: existing.actions.map((action) => ({ ...action, status: 'Succeeded' })),
      };
      releases[releases.indexOf(existing)] = updated;
      return HttpResponse.json(updated);
    }),

    http.post(`${baseUrl}/:id/schedule`, async ({ params, request }) => {
      const existing = releases.find((candidate) => candidate.id === params.id);
      if (!existing) return notFound();
      const dto = (await request.json()) as ScheduleReleaseRequest;
      // Best-effort UTC for the mock — the real backend resolves the IANA zone.
      const updated: ReleaseResponse = {
        ...existing,
        status: 'Ready',
        schedule: {
          localDateTime: toISODateString(dto.localDateTime),
          timeZoneId: dto.timeZoneId,
          scheduledAtUtc: toISODateString(new Date(dto.localDateTime).toISOString()),
        },
      };
      releases[releases.indexOf(existing)] = updated;
      return HttpResponse.json(updated);
    }),

    http.post(`${baseUrl}/:id/cancel`, ({ params }) => {
      const existing = releases.find((candidate) => candidate.id === params.id);
      if (!existing) return notFound();
      const updated: ReleaseResponse = { ...existing, status: 'Draft', schedule: null };
      releases[releases.indexOf(existing)] = updated;
      return HttpResponse.json(updated);
    }),
  ];
}
