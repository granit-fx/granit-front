import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  archiveDashboard,
  getDashboard,
  listDashboardCatalog,
  listDashboards,
  publishDashboard,
  renderDashboard,
  restoreDashboard,
} from '../api/dashboards-api';

import type {
  DashboardCatalogEntryResponse,
  DashboardDetailResponse,
  DashboardRenderResponse,
  DashboardSummaryResponse,
  PagedResponse,
} from '..';

const BASE = '/api/v1/dashboards';
const ID = '8c6b1e10-0000-4000-8000-000000000001';

const CATALOG_ENTRY: DashboardCatalogEntryResponse = {
  name: 'Granit.Showcase.InvoicingOverview',
  category: 'Finance',
  isSystem: false,
  version: '1.0.0',
  widgetCount: 4,
  hasViews: true,
  hasAliases: false,
  hasFilters: true,
};

const SUMMARY: DashboardSummaryResponse = {
  id: ID,
  name: 'Invoicing overview',
  category: 'Finance',
  status: 'Published',
  isSystem: false,
  sourceDefinitionName: 'Granit.Showcase.InvoicingOverview',
  sourceDefinitionVersion: '1.0.0',
  widgetCount: 4,
};

const DETAIL: DashboardDetailResponse = {
  ...SUMMARY,
  layoutColumns: 12,
  layoutRowHeight: 80,
  defaultTimeWindow: null,
  widgets: [],
};

const RENDER_RESPONSE: DashboardRenderResponse = {
  dashboardId: ID,
  renderedAt: '2026-06-06T10:00:00.000Z',
  period: null,
  activeViewName: null,
  driftStatus: 'Aligned',
  sourceDefinitionVersion: '1.0.0',
  registeredVersion: '1.0.0',
  widgets: [],
};

describe('listDashboardCatalog', () => {
  it('calls GET {basePath}/catalog and returns the array', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([CATALOG_ENTRY]));

    const result = await listDashboardCatalog(client, BASE);

    expect(client.get).toHaveBeenCalledWith(`${BASE}/catalog`, { params: { category: undefined } });
    expect(result).toEqual([CATALOG_ENTRY]);
  });

  it('forwards category filter as a query param', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([CATALOG_ENTRY]));

    await listDashboardCatalog(client, BASE, { category: 'Finance' });

    expect(client.get).toHaveBeenCalledWith(`${BASE}/catalog`, { params: { category: 'Finance' } });
  });
});

describe('listDashboards', () => {
  it('calls GET {basePath} with pagination and status params', async () => {
    const client = createMockClient();
    const pagedResult: PagedResponse<DashboardSummaryResponse> = {
      items: [SUMMARY],
      totalCount: 1,
      page: 0,
      pageSize: 50,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(pagedResult));

    const result = await listDashboards(client, BASE, {
      status: 'Published',
      page: 0,
      pageSize: 50,
    });

    expect(client.get).toHaveBeenCalledWith(BASE, {
      params: { status: 'Published', page: 0, pageSize: 50 },
    });
    expect(result.items).toHaveLength(1);
    expect(result.totalCount).toBe(1);
  });
});

describe('getDashboard', () => {
  it('calls GET {basePath}/{id} and returns the detail', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(DETAIL));

    const result = await getDashboard(client, BASE, ID);

    expect(client.get).toHaveBeenCalledWith(`${BASE}/${encodeURIComponent(ID)}`, undefined);
    expect(result.id).toBe(ID);
    expect(result.layoutColumns).toBe(12);
  });
});

describe('renderDashboard', () => {
  it('calls POST {basePath}/{id}/render with the render request body', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(RENDER_RESPONSE));

    const result = await renderDashboard(client, BASE, ID, { locale: 'fr-BE' });

    expect(client.post).toHaveBeenCalledWith(
      `${BASE}/${encodeURIComponent(ID)}/render`,
      { locale: 'fr-BE' },
      undefined
    );
    expect(result.dashboardId).toBe(ID);
    expect(result.driftStatus).toBe('Aligned');
  });
});

describe('publishDashboard', () => {
  it('calls POST {basePath}/{id}/publish and returns the updated summary', async () => {
    const client = createMockClient();
    const published: DashboardSummaryResponse = { ...SUMMARY, status: 'Published' };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(published));

    const result = await publishDashboard(client, BASE, ID);

    expect(client.post).toHaveBeenCalledWith(
      `${BASE}/${encodeURIComponent(ID)}/publish`,
      undefined,
      undefined
    );
    expect(result.status).toBe('Published');
    expect(result.id).toBe(ID);
  });
});

describe('archiveDashboard', () => {
  it('calls POST {basePath}/{id}/archive and returns the updated summary', async () => {
    const client = createMockClient();
    const archived: DashboardSummaryResponse = { ...SUMMARY, status: 'Archived' };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(archived));

    const result = await archiveDashboard(client, BASE, ID);

    expect(client.post).toHaveBeenCalledWith(
      `${BASE}/${encodeURIComponent(ID)}/archive`,
      undefined,
      undefined
    );
    expect(result.status).toBe('Archived');
  });
});

describe('restoreDashboard', () => {
  it('calls POST {basePath}/{id}/restore and returns the updated summary', async () => {
    const client = createMockClient();
    const restored: DashboardSummaryResponse = { ...SUMMARY, status: 'Draft' };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(restored));

    const result = await restoreDashboard(client, BASE, ID);

    expect(client.post).toHaveBeenCalledWith(
      `${BASE}/${encodeURIComponent(ID)}/restore`,
      undefined,
      undefined
    );
    expect(result.status).toBe('Draft');
  });
});
