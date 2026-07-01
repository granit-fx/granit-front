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
  // The query-engine generic surface. Only the catalogue DTO is hand-written;
  // the QueryMetadata family (columns, group-by, …) is a shared schema owned by
  // the package and verified indirectly, per the header note.
  { slug: 'query-engine', package: 'query-engine', types: ['QueryCatalogEntryResponse'] },
  {
    // Only the self-service session/device schemas are published; the provider
    // admin + user-cache surfaces are conditionally registered and absent from
    // the generated spec, so they cannot be oracle-checked here.
    slug: 'identity',
    package: 'identity',
    types: ['UserSessionResponse', 'UserDeviceResponse', 'UserSessionsRevokedResponse'],
  },
  // identity-local is split across two front packages: account (self-service)
  // and authentication-local (login). The spec also exposes External*/Passkey*/
  // Role*/Impersonation*/IdentityLocalConfigResponse schemas the front does not
  // (yet) hand-write — left unregistered until those DTOs exist.
  {
    slug: 'identity-local',
    package: 'account',
    types: [
      'AccountAuthenticatorKeyResponse',
      'AccountChangeEmailRequest',
      'AccountConfirmEmailChangeRequest',
      'AccountDeleteRequest',
      'AccountForgotPasswordRequest',
      'AccountGenerateRecoveryCodesRequest',
      'AccountPasswordChangeRequest',
      'AccountPasswordResetRequest',
      'AccountProfileResponse',
      'AccountProfileUpdateRequest',
      'AccountRecoveryCodesResponse',
      'AccountRegisterRequest',
      'AccountTwoFactorDisableRequest',
      'AccountTwoFactorEmailEnableRequest',
      'AccountTwoFactorEnableRequest',
      'AccountTwoFactorEnableResponse',
      'AccountTwoFactorStatusResponse',
    ],
  },
  {
    slug: 'identity-local',
    package: 'authentication-local',
    types: [
      'AccountLoginRequest',
      'AccountLoginResponse',
      'AccountPasskeyLoginRequest',
      'AccountTwoFactorLoginRequest',
    ],
  },
  // ─── Suffix-aligned modules (front DTOs renamed to mirror the spec schema) ──
  // These packages previously dropped the Response/Request suffix; aligned to
  // the universal convention (name === spec schema) so they are oracle-checked
  // without a name-map.
  {
    slug: 'data-lookup',
    package: 'data-lookup',
    types: [
      'LookupItemResponse',
      'LookupResultResponse',
      'LookupManifestResponse',
      'LookupManifestEntryResponse',
    ],
  },
  {
    slug: 'timeline',
    package: 'timeline',
    types: [
      'ReactionAggregateResponse',
      'ReactionToggleResponse',
      'TimelineAttachmentInfoResponse',
      'TimelineStreamEntryResponse',
      'PostTimelineEntryRequest',
    ],
  },
  {
    slug: 'openiddict',
    package: 'openiddict-admin',
    types: [
      'AdminOidcApplicationResponse',
      'AdminOidcAuthorizationResponse',
      'AdminOidcCreateApplicationRequest',
      'AdminOidcUpdateApplicationRequest',
      'AdminOidcRotateSecretResponse',
      'AdminOidcScopeResponse',
      'AdminOidcCreateScopeRequest',
      'AdminOidcUpdateScopeRequest',
      'AdminOidcCreateAuthorizationRequest',
    ],
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
      'SetConversationFavoriteRequest',
      'ReportMessageRequest',
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
  // ─── Framework — Tier B module coverage (granit-dotnet) ─────────────────────
  // Matching request/response DTOs only. Raw query-engine grid entities
  // (ScheduledAction, WebhookSubscription, WebhookDeliveryAttempt, …) and DTOs
  // the front names differently / does not model (UserNotificationResponse,
  // TemplateDetailResponse, …) are not listed here.
  {
    slug: 'notifications',
    package: 'notifications',
    types: [
      'NotificationDefinition',
      'NotificationSubscriptionResponse',
      'NotificationPreferenceResponse',
      'NotificationPreferenceUpdateRequest',
    ],
  },
  // Web Push subscription endpoints live in their own contract document
  // (Granit.Notifications.WebPush.Endpoints, granit-dotnet PR #2883); the routes
  // are no longer part of notifications.json. Types-only — the two routes are
  // built via buildApiUrl (not the `${basePath}` template the endpoint scanner
  // parses), so route conformance is left off.
  {
    slug: 'notifications-web-push',
    package: 'notifications-web-push',
    types: [
      'WebPushSubscriptionRegisterRequest',
      'WebPushSubscriptionKeys',
      'WebPushSubscriptionRemoveRequest',
    ],
  },
  {
    slug: 'localization',
    package: 'localization',
    types: ['ApplicationLocalizationResponse', 'LocalizationOverride'],
  },
  {
    slug: 'scheduling',
    package: 'scheduling',
    types: ['ScheduledActionResponse', 'RescheduleActionRequest'],
  },
  {
    slug: 'templating',
    package: 'templating',
    types: [
      'SaveTemplateRequest',
      'SaveTemplateCategoryRequest',
      'TemplatePreviewRequest',
      'TemplatePreviewResponse',
    ],
  },
  {
    slug: 'webhooks',
    package: 'webhooks',
    types: [
      'WebhookSubscriptionResponse',
      'WebhookSubscriptionCreateRequest',
      'WebhookSubscriptionCreatedResponse',
      'WebhookSubscriptionUpdateRequest',
      'WebhookSubscriptionDeactivateRequest',
      'WebhookSubscriptionStatsResponse',
      'WebhookSubscriptionTestPingResponse',
      'WebhookEventTypeResponse',
      'WebhookSigningKeyResponse',
      'WebhookSigningKeyCreatedResponse',
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
    types: [
      'DashboardSummaryResponse',
      'DashboardDetailResponse',
      'DashboardCatalogEntryResponse',
      'DashboardImportResponse',
      'DashboardResyncResponse',
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
      'EntityFormFieldManifest',
      'BulkActionRequest',
    ],
  },
  {
    slug: 'entities-customization',
    package: 'entities-customization',
    // LayoutDelta is a discriminated union (reorder|regroup|hide), verified
    // branch-by-branch against the spec's anyOf + discriminator mapping.
    types: ['EntityCustomizationResponse', 'EntityCustomizationRequest', 'LayoutDelta'],
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
    // CategoryDetailResponse stays unregistered — the front intentionally
    // flattens the wire shape ({ category: CategoryResponse, breadcrumb })
    // into `extends CategoryResponse`, which the oracle cannot mirror.
    types: [
      'CategoryResponse',
      'TagResponse',
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
      // Aliases to shared generics in @granit/entity-merge (FieldConflict,
      // MergeRequest<PartyId>, MergeResult<PartyId>) — resolved by the oracle's
      // cross-package generic-instantiation pass.
      'FieldConflictResponse',
      'PartyMergeRequest',
      'PartyMergeResponse',
    ],
  },
  {
    slug: 'invoicing',
    package: 'invoicing',
    types: [
      'InvoiceResponse',
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
  // ─── Framework — additional module coverage (granit-dotnet) ─────────────────
  // Object DTOs only (types-only — route conformance can be layered on later).
  // String-union enums and raw query-engine grid entities are verified
  // indirectly (via referencing fields / the grid), not listed here.
  {
    slug: 'cookies',
    package: 'cookies',
    types: ['CookieConsentConfigResponse', 'CookieDefinitionResponse', 'ThirdPartyServiceResponse'],
  },
  {
    slug: 'diagnostics',
    package: 'diagnostics',
    types: ['MonitoringHealthResponse', 'ServiceHealthResponse'],
  },
  {
    // Capability-gated endpoints — both routes (`/autocomplete`, `/reverse`) are
    // served by `api/` functions. `GeocodeMatchPrecision` is a standalone string
    // enum, verified indirectly via the `precision` field it backs.
    slug: 'geocoding',
    package: 'geocoding',
    types: [
      'GeocodingSuggestionResponse',
      'GeocodingAutocompleteResponse',
      'GeocodingReverseResponse',
    ],
    checkEndpoints: true,
  },
  {
    slug: 'hostnames',
    package: 'hostnames',
    types: [
      'ManagedHostnameResponse',
      'HostnameAvailabilityResponse',
      'CreateManagedHostnameRequest',
      'ReportCertificateStatusRequest',
      'DnsConflict',
      'ExpectedDnsRecord',
    ],
  },
  {
    slug: 'multi-tenancy',
    package: 'multi-tenancy',
    types: ['TenantResponse', 'CreateTenantRequest', 'UpdateTenantRequest'],
  },
  {
    slug: 'presence',
    package: 'presence',
    types: [
      'PresenceResponse',
      'SetPresenceRequest',
      'HeartbeatRequest',
      'HeartbeatRoomRequest',
      'BatchPresenceRequest',
      'BatchPresenceResponse',
      'ResourceRoomResponse',
      'ResourcePresenceParticipantResponse',
    ],
  },
  {
    slug: 'privacy',
    package: 'privacy',
    types: [
      'PrivacyConsentStatusResponse',
      'PrivacyUserAgreementResponse',
      'PrivacyAcceptAgreementRequest',
      'PrivacyLegalDocumentResponse',
      'LegalDocumentDetailResponse',
      'LegalDocumentCreateRequest',
      'LegalDocumentUpdateRequest',
      'PrivacyProcessingPurposeResponse',
      'PrivacyRegulationProfileResponse',
      'PrivacyOptOutStatusResponse',
      'PrivacyExportRequest',
      'PrivacyExportOnBehalfOfRequest',
      'PrivacyExportRequestResponse',
      'PrivacyExportStatusResponse',
      'PrivacyExportScopeResponse',
      'PrivacyDeletionRequest',
      'PrivacyDeletionRequestResponse',
      'PrivacyDeletionStatusResponse',
    ],
  },
  {
    slug: 'settings',
    package: 'settings',
    types: [
      'SettingValueResponse',
      'AdminAppSettingResponse',
      'UpdateSettingValueRequest',
      'BulkUpdateSettingsRequest',
      'BulkUpdateSettingsResponse',
      'BulkSettingEntry',
      'BulkSettingResult',
    ],
  },
  {
    slug: 'validation',
    package: 'validation',
    types: [
      'ValidationFieldValidateRequest',
      'ValidationFieldValidateResponse',
      'ValidationFieldValidateBatchRequest',
      'ValidationFieldValidateBatchResponse',
    ],
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
      'PageTranslationResponse',
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
      'ReleaseScheduleResponse',
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
  // ─── Business — additional module coverage (granit-business) ────────────────
  // Object DTOs only (types-only — route conformance can be layered on later).
  // Raw query-engine grid entities and string-union enums are verified
  // indirectly (via the grid / referencing fields), not listed here.
  {
    slug: 'activities',
    package: 'activities',
    types: [
      'ActivityResponse',
      'ActivityListResponse',
      'ActivityCalendarItemResponse',
      'CreateActivityRequest',
      'ReassignActivityRequest',
      'RescheduleActivityRequest',
    ],
    // CompleteActivityRequest / CancelActivityRequest are empty-body DTOs
    // (`Record<string, never>`) — no fields to verify, not listed.
  },
  {
    slug: 'customer-balance',
    package: 'customer-balance',
    types: [
      'CustomerBalanceResponse',
      'BalanceTransactionResponse',
      'AdminCreditRequest',
      'AdminDebitRequest',
    ],
  },
  {
    slug: 'documents-properties',
    package: 'documents',
    types: ['DocumentPropertiesResponse'],
  },
  {
    slug: 'documents-public-links',
    package: 'documents',
    types: [
      'PublicLinkResponse',
      'CreatePublicLinkRequest',
      'CreatePublicLinkResponse',
      'RevokePublicLinkRequest',
    ],
  },
  {
    slug: 'documents-renditions',
    package: 'documents',
    types: ['RenditionResponse', 'ListRenditionsResponse', 'RenditionDownloadUrlResponse'],
  },
  {
    slug: 'documents-resolution',
    package: 'documents',
    types: ['ResolvedDocumentResponse', 'BatchResolveRequest', 'ResolveItemRequest'],
  },
  {
    slug: 'metering',
    package: 'metering',
    types: [
      'MeterDefinitionResponse',
      'MeterDefinitionCreateRequest',
      'MeterDefinitionUpdateRequest',
      'MeterDefinition',
      'MeterEventRequest',
      'RecordUsageRequest',
      'BackfillUsageRequest',
      'BackfillUsageResponse',
      'RecomputeUsageRequest',
      'RecomputeUsageResponse',
      'DeprecateEventRequest',
      'DeprecateEventResponse',
      'MeteringQuotaStatusResponse',
      'UsageAggregate',
      'UsageAggregateResponse',
    ],
  },
  {
    slug: 'tax',
    package: 'tax',
    types: ['TaxRateResponse', 'TaxRateEntry', 'TaxValidateRequest', 'TaxValidateResponse'],
  },
  {
    slug: 'workspaces',
    package: 'workspaces',
    types: [
      'WorkspaceResponse',
      'WorkspaceSectionResponse',
      'WorkspaceItemResponse',
      'WorkspaceTreeResponse',
      'LandingRouteResponse',
      'SetPinnedLandingRouteRequest',
    ],
  },
  // ─── Analytics + data-exchange (granit-business / granit-dotnet) ────────────
  {
    slug: 'analytics',
    package: 'analytics',
    // Widget definitions (extends WidgetDefinitionBase), MapPointSource (union)
    // and PeriodSpec (union) are not field-by-field checkable. MetricResponse
    // deferred — `refreshHint` is a string enum backend-side, object front-side.
    types: [
      'MetricResponse',
      'MetricRequest',
      'MetricPreviousPayload',
      'MetricSnapshotPayload',
      'MapCenter',
    ],
  },
  {
    slug: 'data-exchange',
    package: 'data-exchange',
    types: [
      'ExportDefinitionResponse',
      'ExportFieldResponse',
      'ExportJobResponse',
      'ExportPresetResponse',
      'CreateExportJobRequest',
      'SaveExportPresetRequest',
      'ImportJobResponse',
      'ImportPreviewResponse',
      'ImportFieldMetadata',
      'ImportRowError',
      'ImportColumnMapping',
      'ConfirmMappingsRequest',
      'ImportReportResponse',
    ],
  },
];
