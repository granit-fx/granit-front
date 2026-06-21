import type { FeatureRouteTable, WorkspaceItemResponse } from '@granit/workspaces';

import { resolveItemHref, resolveItemLabel, resolveLabel } from '../workspace-utils';

function item(partial: Partial<WorkspaceItemResponse>): WorkspaceItemResponse {
  return {
    kind: 'Link',
    order: 0,
    displayKey: null,
    icon: null,
    entityName: null,
    entityViewName: null,
    entityPresetOverlay: null,
    dashboardName: null,
    linkUrl: null,
    subWorkspaceName: null,
    featureName: null,
    routeName: null,
    ...partial,
  } as WorkspaceItemResponse;
}

describe('resolveLabel', () => {
  it('returns the fallback when no display key', () => {
    expect(resolveLabel(null, 'Fallback')).toBe('Fallback');
  });

  it('prefers the translation when t resolves the key', () => {
    const t = (k: string) => (k === 'Ns:Foo.Bar' ? 'Translated' : k);
    expect(resolveLabel('Ns:Foo.Bar', 'Fallback', t)).toBe('Translated');
  });

  it('falls back to the last segment when the translation misses', () => {
    const t = (k: string) => k; // i18next returns the key on a miss
    expect(resolveLabel('Ns:Foo.Bar', 'Fallback', t)).toBe('Bar');
  });

  it('uses the last segment when no t is supplied', () => {
    expect(resolveLabel('Ns:Foo.Bar', 'Fallback')).toBe('Bar');
  });
});

describe('resolveItemHref', () => {
  it('returns the raw url for a Link', () => {
    expect(resolveItemHref(item({ kind: 'Link', linkUrl: 'https://x.test' }))).toBe('https://x.test');
  });

  it('builds a workspace url for a SubWorkspace', () => {
    expect(resolveItemHref(item({ kind: 'SubWorkspace', subWorkspaceName: 'sales' }))).toContain(
      'sales'
    );
  });

  it('routes an Entity through its parent workspace', () => {
    const href = resolveItemHref(item({ kind: 'Entity', entityName: 'Invoice' }), 'billing');
    expect(href).toBe('/w/billing/Invoice');
  });

  it('returns null for an Entity without a parent workspace', () => {
    expect(resolveItemHref(item({ kind: 'Entity', entityName: 'Invoice' }))).toBeNull();
  });

  it('builds a dashboard url', () => {
    expect(resolveItemHref(item({ kind: 'Dashboard', dashboardName: 'kpis' }))).toBe(
      '/dashboards/kpis'
    );
  });

  it('resolves a Feature via the route table', () => {
    const routes: FeatureRouteTable = { 'parties.list': { path: '/crm/parties' } };
    const href = resolveItemHref(
      item({ kind: 'Feature', routeName: 'parties.list' }),
      null,
      routes
    );
    expect(href).toBe('/crm/parties');
  });

  it('returns null for an unregistered Feature route', () => {
    const routes: FeatureRouteTable = {};
    expect(
      resolveItemHref(item({ kind: 'Feature', routeName: 'missing' }), null, routes)
    ).toBeNull();
  });
});

describe('resolveItemLabel', () => {
  it('falls back to the entity name when no display key', () => {
    expect(resolveItemLabel(item({ kind: 'Entity', entityName: 'Invoice' }))).toBe('Invoice');
  });

  it('falls back to the kind when nothing else is set', () => {
    expect(resolveItemLabel(item({ kind: 'Link' }))).toBe('Link');
  });
});
