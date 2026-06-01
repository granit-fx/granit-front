// ---------------------------------------------------------------------------
// @granit/workspaces — public API (framework-agnostic)
// ---------------------------------------------------------------------------
//
// Mirrors the .NET DTOs from Granit.Workspaces.Abstractions +
// Granit.Workspaces.Endpoints.Dtos so any consumer (React renderer, mobile
// app, future Vue port) can read the `/workspaces` and `/me/landing-route`
// payloads with full type safety.
//
// Wire conventions match @granit/entities: camelCase property names
// (System.Text.Json default), PascalCase string-literal enums (Granit
// registers a `JsonStringEnumConverter` without naming policy),
// `IReadOnlyList<T>` → `readonly T[]`, `IReadOnlyDictionary<string, T>` →
// `Readonly<Record<string, T>>`.

export { buildEntityUrl, buildWorkspaceUrl, parseEntityUrl, parseWorkspaceUrl } from './url/index';
export type { ParsedEntityUrl, ParsedWorkspaceUrl } from './url/index';
export { InvalidFeatureNameError, resolveFeatureRoute } from './routes/index';
export type { FeatureRouteSpec, FeatureRouteTable } from './routes/index';
export { WORKSPACE_TREE_SCHEMA_VERSION } from './types/index';
export { getLandingRoute, getWorkspaceTree, setPinnedLandingRoute } from './api/workspaces-api';
export type {
  LandingRouteResponse,
  LandingRouteSource,
  SetPinnedLandingRouteRequest,
  WorkspaceItemKind,
  WorkspaceItemResponse,
  WorkspaceResponse,
  WorkspaceSectionResponse,
  WorkspaceTreeResponse,
} from './types/index';
