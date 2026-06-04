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
}

export const CONTRACTS: readonly ModuleContract[] = [
  { slug: 'background-jobs', package: 'background-jobs', types: ['BackgroundJobStatus'] },
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
  },
];
