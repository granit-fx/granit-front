import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  FeatureRouteTableProvider,
  resolveWorkspaceItem,
  useFeatureRouteTable,
  useResolvedWorkspaceItem,
} from '../routes/feature-route-context';

import type { FeatureRouteTable, WorkspaceItemResponse } from '@granit/workspaces';
import type { ReactNode } from 'react';

const ROUTES: FeatureRouteTable = {
  'identity.users.list': { path: '/users' },
  'invoicing.invoices.list': { path: '/invoicing' },
};

function makeItem(partial: Partial<WorkspaceItemResponse>): WorkspaceItemResponse {
  return {
    kind: 'Feature',
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
  };
}

function withProvider(table: FeatureRouteTable | null) {
  return ({ children }: { children: ReactNode }) =>
    table === null ? (
      <>{children}</>
    ) : (
      <FeatureRouteTableProvider table={table}>{children}</FeatureRouteTableProvider>
    );
}

describe('resolveWorkspaceItem', () => {
  it('resolves a Feature item via routeName', () => {
    const item = makeItem({
      kind: 'Feature',
      featureName: 'invoicing.invoices.list',
      routeName: 'invoicing.invoices.list',
    });
    expect(resolveWorkspaceItem(item, ROUTES)).toEqual({
      href: '/invoicing',
      missingRoute: false,
      featureName: 'invoicing.invoices.list',
      spec: { path: '/invoicing' },
    });
  });

  it('falls back to featureName when routeName is null', () => {
    const item = makeItem({
      kind: 'Feature',
      featureName: 'identity.users.list',
      routeName: null,
    });
    expect(resolveWorkspaceItem(item, ROUTES).href).toBe('/users');
  });

  it('flags missingRoute when the host table has no entry', () => {
    const item = makeItem({
      kind: 'Feature',
      featureName: 'unknown.x.list',
      routeName: 'unknown.x.list',
    });
    const resolved = resolveWorkspaceItem(item, ROUTES);
    expect(resolved.href).toBeNull();
    expect(resolved.missingRoute).toBe(true);
    expect(resolved.featureName).toBe('unknown.x.list');
  });

  it('flags missingRoute when both routeName and featureName are null', () => {
    const item = makeItem({ kind: 'Feature' });
    const resolved = resolveWorkspaceItem(item, ROUTES);
    expect(resolved.href).toBeNull();
    expect(resolved.missingRoute).toBe(true);
  });

  it('passes Link items through unchanged', () => {
    const item = makeItem({ kind: 'Link', linkUrl: 'https://example.com/docs' });
    expect(resolveWorkspaceItem(item, ROUTES)).toEqual({
      href: 'https://example.com/docs',
      missingRoute: false,
      featureName: null,
      spec: null,
    });
  });

  it('returns null href for non-Feature, non-Link kinds (URL computed elsewhere)', () => {
    const entity = makeItem({ kind: 'Entity', entityName: 'Party' });
    expect(resolveWorkspaceItem(entity, ROUTES).href).toBeNull();

    const dashboard = makeItem({ kind: 'Dashboard', dashboardName: 'Sales' });
    expect(resolveWorkspaceItem(dashboard, ROUTES).href).toBeNull();
  });
});

describe('useFeatureRouteTable', () => {
  it('returns the provided table inside a provider', () => {
    const { result } = renderHook(() => useFeatureRouteTable(), {
      wrapper: withProvider(ROUTES),
    });
    expect(result.current).toBe(ROUTES);
  });

  it('returns an empty table when no provider is mounted', () => {
    const { result } = renderHook(() => useFeatureRouteTable(), {
      wrapper: withProvider(null),
    });
    expect(result.current).toEqual({});
  });
});

describe('useResolvedWorkspaceItem', () => {
  it('resolves a Feature item against the context table', () => {
    const item = makeItem({
      kind: 'Feature',
      featureName: 'invoicing.invoices.list',
      routeName: 'invoicing.invoices.list',
    });
    const { result } = renderHook(() => useResolvedWorkspaceItem(item), {
      wrapper: withProvider(ROUTES),
    });
    expect(result.current.href).toBe('/invoicing');
    expect(result.current.missingRoute).toBe(false);
  });

  it('flags missingRoute without a provider', () => {
    const item = makeItem({
      kind: 'Feature',
      featureName: 'invoicing.invoices.list',
      routeName: 'invoicing.invoices.list',
    });
    const { result } = renderHook(() => useResolvedWorkspaceItem(item), {
      wrapper: withProvider(null),
    });
    expect(result.current.href).toBeNull();
    expect(result.current.missingRoute).toBe(true);
  });
});
