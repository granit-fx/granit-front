/**
 * Conformance manifest — one entry per covered module. Extending coverage is a
 * single line here (after vendoring the spec via scripts/sync-openapi-contracts.mjs).
 *
 * `types` lists the per-module DTO interfaces to verify; the spec schema name is
 * assumed identical to the front interface name (the framework naming rule).
 * Shared schemas (query-engine metadata, ProblemDetails, `*Of*` wrapper
 * generics) belong to their owning package and are intentionally not listed here.
 */
export interface ModuleContract {
  /** contracts/openapi/<slug>.json */
  readonly slug: string;
  /** packages/@granit/<package> */
  readonly package: string;
  /** DTO interfaces to check (spec schema name === front interface name). */
  readonly types: readonly string[];
  /**
   * Also verify route/verb conformance: every spec `path`+`method` has a front
   * `client.METHOD()` call at the same route. Opt-in — leave off for modules
   * whose routes are served by native `fetch` (BFF) instead of the Axios client.
   */
  readonly checkEndpoints?: boolean;
  /**
   * Routes (relative to `basePath`, params as `{}`) to skip in the endpoint
   * check — served by the query-engine generic surface (`''` list, `'/meta'`)
   * rather than a module `api/` function.
   */
  readonly endpointIgnore?: readonly string[];
}

export const CONTRACTS: readonly ModuleContract[] = [
  {
    slug: 'background-jobs',
    package: 'background-jobs',
    types: ['BackgroundJobStatus'],
    checkEndpoints: true,
  },
  { slug: 'bff', package: 'bff', types: ['BffCsrfTokenResponse'] },
  {
    slug: 'blob-storage',
    package: 'blob-storage',
    types: [
      'BlobUploadInitiateRequest',
      'BlobUploadInitiateResponse',
      'BlobConfirmUploadRequest',
      'BlobConfirmUploadResponse',
      'BlobDownloadUrlRequest',
      'BlobDownloadUrlResponse',
      'BlobDeleteRequest',
      'BlobDescriptorResponse',
      'BlobCleanupOrphansResponse',
    ],
    checkEndpoints: true,
    endpointIgnore: ['', '/meta'],
  },
  {
    slug: 'api-keys',
    package: 'authentication-api-keys',
    types: [
      'ApiKeyResponse',
      'ApiKeyCreateRequest',
      'ApiKeyCreateResponse',
      'ApiKeyRotateResponse',
      'ApiKeyUpdateScopesRequest',
    ],
    checkEndpoints: true,
  },
  {
    slug: 'ai',
    package: 'ai',
    types: [
      'AIProviderResponse',
      'AIProviderModelResponse',
      'AIChatRequest',
      'AIChatMessageRequest',
      'AIChatResponse',
      'AIChatUsageResponse',
      'AIEmbeddingRequest',
      'AIEmbeddingResponse',
      'AIEmbeddingDataResponse',
      'AIEmbeddingUsageResponse',
      'AIWorkspaceResponse',
      'AIWorkspaceListResponse',
      'AIWorkspaceCreateRequest',
      'AIWorkspaceUpdateRequest',
      'AIModelCapabilities',
      'AIUsageRecord',
    ],
    checkEndpoints: true,
    endpointIgnore: ['/usage', '/usage/meta'],
  },
  {
    slug: 'auditing',
    package: 'auditing',
    types: [
      'AuditEntryResponse',
      'AuditEntryDetailResponse',
      'AuditEntityChangeResponse',
      'AuditEntityChangeSummaryResponse',
      'AuditPropertyChangeResponse',
    ],
  },
  {
    slug: 'authorization',
    package: 'authorization',
    types: [
      'MyPermissionsResponse',
      'PermissionDefinitionResponse',
      'PermissionGroupResponse',
      'PermissionGrantResponse',
    ],
  },
  {
    slug: 'features',
    package: 'features',
    types: [
      'FeatureDefinitionResponse',
      'FeatureGroupResponse',
      'FeatureNumericConstraintResponse',
      'FeatureValueResponse',
      'SetFeatureOverrideRequest',
    ],
    checkEndpoints: true,
  },
];
