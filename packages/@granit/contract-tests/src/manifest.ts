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
    // Only the self-service session/device schemas are published; the provider
    // admin + user-cache surfaces are conditionally registered and absent from
    // the generated spec, so they cannot be oracle-checked here.
    slug: 'identity',
    package: 'identity',
    types: ['UserSessionResponse', 'UserDeviceResponse', 'UserSessionsRevokedResponse'],
  },
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
    // The list (`/api-keys`) and `/api-keys/meta` are served by the query-engine
    // generic surface (getPage/getQueryMeta), not by a `client.METHOD` call in
    // this module's api/. The module base auto-detects to `/authentication`.
    endpointIgnore: ['/api-keys', '/api-keys/meta'],
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
    slug: 'ai-chat',
    package: 'ai-chat',
    types: [
      'ConversationSummaryResponse',
      'ConversationResponse',
      'MessageResponse',
      'CreateConversationRequest',
      'RenameConversationRequest',
      'SendMessageRequest',
      'MentionRequest',
      'AttachmentRequest',
      'ChatStreamEvent',
      'SuggestedActionResponse',
      'ClarificationResponse',
      'ClarificationOptionResponse',
      'ChatWorkspacesResponse',
    ],
    checkEndpoints: true,
  },
  {
    slug: 'ai-prompts',
    package: 'ai-prompts',
    types: [
      'PromptSummaryResponse',
      'PromptResponse',
      'PromptPickerResponse',
      'PromptPickerCategoryResponse',
      'PromptPickerItemResponse',
      'CreatePromptRequest',
      'UpdatePromptRequest',
    ],
    checkEndpoints: true,
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
  // ─── Business — Tier B module coverage (granit-business) ────────────────────
  // Object request/response DTOs only (types-only). Raw query-engine grid
  // entities (Product, Document, Party, Invoice, Plan, Subscription, …),
  // value objects and string-union enums are verified indirectly / via the
  // grid and are intentionally not listed. A handful of API DTOs the front
  // does not yet model (e.g. taxonomy Search*, dashboards DashboardRender*,
  // invoicing WorkflowTransition*) are left for a later pass.
  {
    slug: 'catalog',
    package: 'catalog',
    types: [
      'ProductResponse',
      'ProductCreateRequest',
      'ProductUpdateRequest',
      'UpdateProductMetadataRequest',
      'ProductExternalMappingResponse',
      'AddProductExternalMappingRequest',
    ],
  },
  {
    slug: 'dashboards',
    package: 'dashboards',
    // TODO(contract): Dashboard{Summary,Detail,CatalogEntry,Import,Resync}Response
    // deferred — front models `category`/`status` as objects while the backend
    // schema is a string enum (real type-family mismatch to reconcile).
    types: [
      'DashboardMetadataUpdateRequest',
      'WidgetInstanceResponse',
      'AddWidgetRequest',
      'UpdateWidgetRequest',
      'WidgetAction',
    ],
  },
  {
    slug: 'documents',
    package: 'documents',
    types: [
      'DocumentResponse',
      'DocumentVersionResponse',
      'ListDocumentVersionsResponse',
      'AppendVersionRequest',
      'FinalizeUploadRequest',
      'UploadTicketRequest',
      'UploadTicketResponse',
      'DownloadUrlResponse',
      'RenameDocumentRequest',
      'MoveDocumentRequest',
      'FolderResponse',
      'FolderBreadcrumbResponse',
      'ListFoldersResponse',
      'CreateFolderRequest',
      'RenameFolderRequest',
      'MoveFolderRequest',
      'ShareResponse',
      'ListSharesResponse',
      'GrantShareRequest',
      'DocumentTagResponse',
      'DocumentTagAssignmentResponse',
      'ListDocumentTagsResponse',
      'TrashedDocumentResponse',
      'ListTrashedDocumentsResponse',
      'TenantStorageQuotaResponse',
    ],
  },
  {
    slug: 'entities',
    package: 'entities',
    types: [
      'EntityManifestResponse',
      'EntityDiscoveryResponse',
      'EntityDiscoveryLinks',
      'EntityActionManifest',
      'EntityActivitiesManifest',
      'EntityDetailManifest',
      'EntityDetailSectionManifest',
      'EntityDetailSidePanelManifest',
      'EntityIdentitySection',
      'EntityPermissionsSection',
      'EntityCollectionsSection',
      'EntityCollectionReference',
      'EntityProvenance',
      'EntityFormManifest',
      'EntityFormSectionManifest',
      'EntityFormOwnedCollectionManifest',
      'EntityListLayoutManifest',
      'EntityGalleryLayoutManifest',
      'EntityGalleryCardActionManifest',
      'EntityKanbanLayoutManifest',
      'EntityKanbanColumnManifest',
      'EntityKanbanCardManifest',
      'EntityKanbanCardActionManifest',
      'EntityKanbanCardRelationManifest',
      'EntityCalendarLayoutManifest',
      'EntityCalendarTileActionManifest',
      'EntityHeaderActionManifest',
      'EntitySelectionActionManifest',
      'EntityRelationManifest',
      'EntityRelationAggregateManifest',
      'RelationAggregateValue',
      'RelationAggregatesRequest',
      'RelationAggregatesResponse',
      'VisibilityCondition',
      'CalendarItemResponse',
      'BulkActionResponse',
      'BulkActionFailure',
    ],
    // TODO(contract): EntityFormFieldManifest deferred — front carries a `lookup`
    // field absent from the backend schema. BulkActionRequest deferred — `payload`
    // is nullable backend-side but not front-side.
  },
  {
    slug: 'entities-customization',
    package: 'entities-customization',
    // TODO(contract): LayoutDelta deferred — it is a discriminated union
    // (Reorder|Regroup|Hide), which the field-by-field oracle cannot verify.
    types: ['EntityCustomizationResponse', 'EntityCustomizationRequest'],
  },
  {
    slug: 'entities-views',
    package: 'entities-views',
    types: [
      'EntityViewResponse',
      'EntityViewCreateBodyRequest',
      'EntityViewUpdateBodyRequest',
      'EntityViewShareBodyRequest',
      'EntityViewToggleFlagRequest',
    ],
  },
  {
    slug: 'taxonomy',
    package: 'taxonomy',
    // TODO(contract): CategoryResponse (orphan `hasChildren`), CategoryDetailResponse
    // (missing `category`) and TagResponse (orphan `createdAt`/`updatedAt`) deferred —
    // front fields diverge from the current backend schema.
    types: [
      'CategoryAssignmentResponse',
      'CreateCategoryRequest',
      'UpdateCategoryRequest',
      'MoveCategoryRequest',
      'TagAssignmentResponse',
      'CreateTagRequest',
      'UpdateTagRequest',
    ],
  },
  {
    slug: 'subscriptions',
    package: 'subscriptions',
    types: [
      'PlanResponse',
      'PlanCreateRequest',
      'PlanUpdateRequest',
      'PlanPriceResponse',
      'CreatePriceVersionRequest',
      'MigratePriceRequest',
      'BulkMigratePriceRequest',
      'BulkMigratePriceResponse',
      'SubscriptionResponse',
      'SubscriptionCreateRequest',
      'SubscriptionChangePlanRequest',
      'SubscriptionCancelRequest',
      'SeatResponse',
      'SeatAssignRequest',
    ],
  },
  {
    slug: 'parties',
    package: 'parties',
    types: [
      'PartyResponse',
      'PartyCreateRequest',
      'PartyUpdateRequest',
      'PartyMetadataRequest',
      'PartySuspendRequest',
      'PartyRoleRequest',
      'PartyAddressResponse',
      'PartyAddressRequest',
      'PartyEmailResponse',
      'PartyEmailRequest',
      'PartyPhoneResponse',
      'PartyPhoneRequest',
      'PartyTaxStatusResponse',
      'PartyTaxStatusRequest',
      'PartyExternalMappingResponse',
      'PartyExternalMappingRequest',
      'PartyCreateConflictResponse',
      'PartyCreateDuplicateCandidate',
      'DuplicateMatchSignalResponse',
      'PartyDuplicateCandidateResponse',
      'PartyDuplicateMergeRequest',
    ],
    // TODO(contract): FieldConflictResponse / PartyMergeRequest / PartyMergeResponse
    // deferred — declared as aliases to shared/generic types (FieldConflict,
    // MergeRequest<PartyId>, MergeResult<PartyId>), which the oracle cannot resolve.
  },
  {
    slug: 'invoicing',
    package: 'invoicing',
    // TODO(contract): InvoiceResponse deferred — backend `partyId` (required) is
    // missing from the front type.
    types: [
      'InvoiceLineItemResponse',
      'InvoiceCreateRequest',
      'FinalizeInvoiceRequest',
      'CancelInvoiceRequest',
      'MarkInvoiceUncollectibleRequest',
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
  // ─── CMS bounded context (granit-website / Granit.Cms.*.Endpoints) ──────────
  // Specs vendored from Granit.Cms.OpenApi.Generator. Object DTOs only — the
  // oracle is a field-by-field checker, so standalone string-union enums
  // (ReleaseStatus, RedirectType, SuggestionStatus, …) are verified indirectly
  // via the fields that reference them, not listed here. Endpoint-route checks
  // are deferred (list/grid surfaces are served by the query-engine generic
  // helper and several routes are X-Granit-Site header-scoped, not a literal
  // api/ client call).
  {
    slug: 'cms',
    package: 'cms',
    types: [
      'SiteResponse',
      'CreateSiteRequest',
      'UpdateSiteRequest',
      'PageResponse',
      'PageTranslation',
      'PageTreeNodeResponse',
      'PageVersionSummaryResponse',
      'PublishedPageResponse',
      'DraftPagePreviewResponse',
      'PageDraftConflictResponse',
      'CreatePageRequest',
      'MovePageRequest',
      'MintPreviewTokenRequest',
      'MintPreviewTokenResponse',
      'PageSearchHitResponse',
      'PageSearchPageResponse',
      'PageEditingPresenceEntryResponse',
      'PageEditingPresenceResponse',
      'MenuResponse',
      'MenuItemResponse',
      'MenuItemRequest',
      'ResolvedMenu',
      'ResolvedMenuItem',
      'ReleaseResponse',
      'ReleaseActionResponse',
      'ReleaseSchedule',
      'CreateReleaseRequest',
      'AddReleaseActionRequest',
      'ScheduleReleaseRequest',
      'BlockCatalogResponse',
      'BlockCategoryGroup',
      'BlockCatalogEntry',
      'BlockFieldDescriptor',
      'BlockFieldOption',
      'BlockDataResolveRequest',
      'BlockDataResponse',
    ],
  },
  {
    slug: 'cms-redirects',
    package: 'cms-redirects',
    types: [
      'RedirectResponse',
      'RedirectCreateRequest',
      'RedirectUpdateRequest',
      'RedirectMutationResult',
      'ResolveResponse',
      'RedirectPreviewResponse',
      'SiteRedirectSettingsRequest',
      'SiteRedirectSettingsResponse',
    ],
  },
  {
    slug: 'cms-seo',
    package: 'cms-seo',
    types: [
      'SeoMetadataResponse',
      'SeoMetadataRequest',
      'EffectiveSeoResponse',
      'SiteSeoDefaultsRequest',
      'SiteSeoDefaultsResponse',
      'OpenGraph',
      'OpenGraphArticle',
      'TwitterCard',
      'OgImage',
      'ImageDimensions',
      'Hreflang',
      'RobotsDirective',
      'RobotsTxtRule',
      'WebManifest',
      'WebManifestIcon',
      'SerpPreviewResponse',
      'SeoSuggestionListResponse',
      'SeoSuggestionDiff',
      'SeoSuggestionFieldDiff',
    ],
  },
  {
    slug: 'cms-hostnames',
    package: 'cms-hostnames',
    types: [
      'SiteHostnameResponse',
      'SiteHostnameAvailabilityResponse',
      'SiteHostnameDnsRecordResponse',
      'SiteHostnameCreateRequest',
    ],
  },
  // ─── Business payments (granit-business / Granit.Payments.Endpoints) ────────
  // Object DTOs only. The list/grid surfaces (GET /transactions, /methods,
  // /configuration) are served by the query-engine generic helper, so route
  // conformance is left off here. Standalone string-union enums (PaymentStatus,
  // RefundStatus, DisputeStatus, PaymentMethodCategory, PaymentMethodSequenceTypeName
  // — the last also name-shifted from the spec's `PaymentMethodSequenceType`) are
  // verified indirectly via the fields that reference them, per the field-by-field
  // oracle, not listed here.
  {
    slug: 'payments',
    package: 'payments',
    types: [
      'PaymentChargeRequest',
      'PaymentRefundRequest',
      'PaymentCheckoutRequest',
      'PaymentAttachMethodRequest',
      'PaymentTransactionResponse',
      'PaymentRefundResponse',
      'PaymentDisputeResponse',
      'PaymentCheckoutSessionResponse',
      'PaymentMethodResponse',
      'PaymentAvailableMethodResponse',
      'PaymentMethodCapabilityResponse',
      'PaymentMethodAmountBoundResponse',
      'PaymentMethodConfigurationItemResponse',
      'PaymentProviderConfigurationResponse',
      'PaymentCatalogMethod',
      'PaymentProviderCatalogResponse',
    ],
  },
  // ─── Business bank accounts (granit-business / Granit.BankAccounts.Endpoints) ─
  // `BankAccountResponse` (masked CRUD projection) + `BankAccount` (raw QE grid
  // entity) + the create request. Standalone enums (BankAccountScheme/Status/Type)
  // are verified indirectly via referencing fields. The admin grid (GET '' +
  // '/meta') is served by the query-engine generic helper, so those routes are
  // ignored — POST '' (create) shares the base route and is therefore unchecked
  // here, but covered by the package's own unit tests.
  {
    slug: 'bank-accounts',
    package: 'bank-accounts',
    types: ['CreateBankAccountRequest', 'BankAccountResponse', 'BankAccount'],
    checkEndpoints: true,
    endpointIgnore: ['', '/meta'],
  },
  {
    slug: 'sepa-transfer',
    package: 'payments-sepa-transfer',
    types: ['SepaTransferConfigurationRequest', 'SepaTransferConfigurationResponse'],
    checkEndpoints: true,
  },
  {
    // The mandate admin grid (GET /mandates + /mandates/meta) is served by the
    // query-engine generic surface, not by an api/ function — ignore those
    // routes (POST /mandates create shares the route, so it is unchecked here
    // but covered by the package's own unit tests).
    slug: 'sepa-direct-debit',
    package: 'payments-sepa-direct-debit',
    types: [
      'CreateMandateRequest',
      'ConfirmMandateRequest',
      'MandateSetupResponse',
      'MandateResponse',
      'SepaConfigurationRequest',
      'SepaConfigurationResponse',
    ],
    checkEndpoints: true,
    endpointIgnore: ['/mandates', '/mandates/meta'],
  },
];
