import { resolveLabel } from '@granit/react-localization';
import {
  buildWorkspaceUrl,
  resolveFeatureRoute,
  type FeatureRouteTable,
  type WorkspaceItemResponse,
} from '@granit/workspaces';

// Re-export the shared label resolver (canonical home: @granit/react-localization)
// so workspace-utils stays the single import surface for shell-admin's helpers.
export { resolveLabel };

// Loose i18next TFunction shape — keeps the helper free of
// `react-i18next` peer typings.
type TranslateFn = (key: string) => string;

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
