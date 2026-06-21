import {
  buildWorkspaceUrl,
  resolveFeatureRoute,
  type FeatureRouteTable,
  type WorkspaceItemResponse,
} from '@granit/workspaces';

// Loose i18next TFunction shape — keeps the helper free of
// `react-i18next` peer typings.
type TranslateFn = (key: string) => string;

// Resolves a backend display key (e.g. `AuditingEndpoints:Workspace.Item`)
// to its translated label. When a `t` function is provided, i18next is
// consulted first; otherwise (or when the translation misses) we fall
// back to the last segment of the key, then to the supplied fallback.
//
// The showcase `i18n` instance is configured with
// `nsSeparator: false; keySeparator: false`, so `t(displayKey)` is a
// literal lookup against the flat bundle populated by
// `LocalizationProvider`. The last-segment fallback only matters when
// the backend translation hasn't loaded yet.
export function resolveLabel(displayKey: string | null, fallback: string, t?: TranslateFn): string {
  if (!displayKey) return fallback;
  if (t) {
    const translated = t(displayKey);
    if (translated && translated !== displayKey) return translated;
  }
  const lastSegment = displayKey.split(/[.:]/).pop();
  return lastSegment && lastSegment.length > 0 ? lastSegment : fallback;
}

// Resolves the navigation URL for one workspace item. Entity items route
// through `/w/{parentWorkspace}/{entityName}` so the manifest renderer
// (`<EntityList />`) takes over instead of the legacy per-feature route —
// callers must pass the parent workspace name (typically the workspace the
// item belongs to). `Feature` items (ADR-057) resolve through the host's
// `FeatureRouteTable`; an unregistered route name yields `null`, which the
// renderer surfaces as a disabled placeholder. Falls back to `null` when
// the parent isn't supplied for Entity items.
export function resolveItemHref(
  item: WorkspaceItemResponse,
  parentWorkspaceName?: string | null,
  featureRoutes?: FeatureRouteTable
): string | null {
  switch (item.kind) {
    case 'Link':
      return item.linkUrl;
    case 'SubWorkspace':
      return item.subWorkspaceName ? buildWorkspaceUrl(item.subWorkspaceName) : null;
    case 'Entity':
      if (!item.entityName || !parentWorkspaceName) return null;
      return `/w/${encodeURIComponent(parentWorkspaceName)}/${encodeURIComponent(item.entityName)}`;
    case 'Dashboard':
      return item.dashboardName ? `/dashboards/${encodeURIComponent(item.dashboardName)}` : null;
    case 'Feature': {
      if (!featureRoutes) return null;
      const lookupKey = item.routeName ?? item.featureName;
      if (!lookupKey) return null;
      return resolveFeatureRoute(featureRoutes, lookupKey)?.path ?? null;
    }
    default:
      return null;
  }
}

// Resolves a default item label given the available DTO fields. Pass `t`
// from `useTranslation()` so backend display keys (e.g.
// `AuditingEndpoints:Workspace.Item`) get translated against the loaded
// i18n namespaces before falling back to the last segment.
export function resolveItemLabel(item: WorkspaceItemResponse, t?: TranslateFn): string {
  return resolveLabel(
    item.displayKey,
    item.entityName ?? item.subWorkspaceName ?? item.dashboardName ?? item.featureName ?? item.kind,
    t
  );
}
