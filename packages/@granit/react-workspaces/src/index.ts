// ---------------------------------------------------------------------------
// @granit/react-workspaces — public API
// ---------------------------------------------------------------------------
//
// React shell for the workspace tree: WorkspaceNav sidebar, route helpers
// (/w/{workspace}/... and /entity/{id}), the Notion-style SidePeek drawer,
// and the LandingRedirect that consumes the .NET 5-tier resolver.
//
// Implementation lands in subsequent stories of granit-fx/granit-front#300.

export { landingRouteQueryKey, useLandingRoute, useSetLandingPin } from './hooks/use-landing-route';
export { useWorkspaces, workspaceTreeQueryKey } from './hooks/use-workspaces';
export { useLandingRedirect, useSidePeek } from './hooks/index';
export {
  FeatureRouteTableProvider,
  resolveWorkspaceItem,
  useFeatureRouteTable,
  useResolvedWorkspaceItem,
} from './routes/index';
export type { FeatureRouteTableProviderProps, ResolvedWorkspaceItem } from './routes/index';
export type {
  SidePeekEntry,
  UseLandingRedirectOptions,
  UseLandingRedirectReturn,
  UseSidePeekOptions,
  UseSidePeekReturn,
} from './hooks/index';
