# CLAUDE.md - Granit Front

## Project

- **Type**: TypeScript/React framework library — packages `@granit/*`
- **Purpose**: Shared framework for Digital Dynamics front-end applications
- **Equivalent**: JavaScript/TypeScript counterpart of `granit-dotnet` (.NET framework)
- **Location**: this repository root
- **Consumers**: showcase-admin-react (via pnpm `link:` protocol + Vite aliases)

## Packages

| Package                                     | Purpose                                                                                                                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@granit/account`                           | Account self-service types and API: registration, profile, password, 2FA/TOTP, external logins, passkeys/WebAuthn, session, deletion — mirrors `Granit.Identity.Local.Endpoints` .NET       |
| `@granit/react-account`                     | React hooks for `@granit/account`: `AccountProvider`, `useProfile`, `useRegister`, `useChangePassword`, `useTwoFactorStatus`, `usePasskeys`, `useExternalLogins`, `useDeleteAccount`        |
| `@granit/authentication`                    | Provider-agnostic OIDC authentication types: `BaseAuthContextType`, `OidcUserInfo`, `LoginOptions`, `LogoutOptions` — base for all `authentication-{provider}` packages                     |
| `@granit/react-authentication`              | Generic React bindings for `@granit/authentication`: `createAuthContext`, `createMockProvider` — provider-agnostic factories                                                                |
| `@granit/authentication-keycloak`           | Keycloak OIDC types: `KeycloakAuthContextType`, `KeycloakCoreConfig`, `KeycloakEvent`, `KeycloakUserInfo` — mirrors `Granit.Authentication.JwtBearer.Keycloak` .NET                         |
| `@granit/react-authentication-keycloak`     | React hooks for Keycloak: `useKeycloakInit` — PKCE S256, silent SSO, token refresh, `@granit/api-client` wiring                                                                             |
| `@granit/authentication-entraid`            | Microsoft Entra ID (Azure AD) types: `EntraIdAuthContextType`, `EntraIdCoreConfig` — mirrors `Granit.Authentication.JwtBearer.EntraId` .NET                                                 |
| `@granit/react-authentication-entraid`      | React hooks for Entra ID: `useEntraIdInit` — MSAL.js, redirect flow, `@granit/api-client` wiring                                                                                            |
| `@granit/authentication-cognito`            | AWS Cognito User Pools types: `CognitoAuthContextType`, `CognitoCoreConfig` — mirrors `Granit.Authentication.JwtBearer.Cognito` .NET                                                        |
| `@granit/react-authentication-cognito`      | React hooks for Cognito: `useCognitoInit` — amazon-cognito-identity-js, Hosted UI, `@granit/api-client` wiring                                                                              |
| `@granit/authentication-google-cloud`       | Google Cloud Identity Platform types: `GoogleCloudAuthContextType`, `GoogleCloudCoreConfig` — mirrors `Granit.Authentication.JwtBearer.GoogleCloud` .NET                                    |
| `@granit/react-authentication-google-cloud` | React hooks for Google Cloud: `useGoogleCloudInit` — Firebase Auth, redirect flow, `@granit/api-client` wiring                                                                              |
| `@granit/authentication-local`              | Local credential auth types and API: `loginAccount`, `verifyTwoFactorLogin`, `beginPasskeyAssertion`, `completePasskeyAssertion` — mirrors `Granit.Identity.Local.Endpoints` .NET           |
| `@granit/react-authentication-local`        | React hooks for local auth: `LocalAuthProvider`, `useLogin`, `useVerifyTwoFactorLogin`, `useBeginPasskeyAssertion`, `useCompletePasskeyAssertion`                                           |
| `@granit/authentication-api-keys`           | API key management types: `ApiKeyResponse`, `ApiKeyCreateRequest`, `ApiKeyCreateResponse`, `ApiKeyRotateResponse` — mirrors `Granit.Authentication.ApiKeys` .NET                            |
| `@granit/react-authentication-api-keys`     | React hooks for `@granit/authentication-api-keys`: `useApiKeys`, `useApiKey`, `useCreateApiKey`, `useRevokeApiKey`, `useRotateApiKey`, `useUpdateApiKeyScopes`                              |
| `@granit/authorization`                     | Permission/role authorization types: `PermissionsResponse`, `PermissionDefinitionDto`, `PermissionGroupDto`, `PermissionGrantDto` — mirrors `Granit.Authorization` .NET                     |
| `@granit/react-authorization`               | React hooks for `@granit/authorization`: `usePermissions`, `usePermissionDefinitions`, `useRolePermissions`, `usePermissionGrant`                                                           |
| `@granit/logger`                            | Configurable logger factory (`createLogger(prefix)`)                                                                                                                                        |
| `@granit/logger-otlp`                       | OpenTelemetry log transport: `createOtlpTransport` for `@granit/logger`                                                                                                                     |
| `@granit/utils`                             | Shared utilities (`cn`, `formatDate`, `formatNumber`, …)                                                                                                                                    |
| `@granit/api-client`                        | Axios factory (`createApiClient`, `setTokenGetter`), shared response types (`ProblemDetails`), error classes (`HttpError`, `ValidationError`, `TimeoutError`)                               |
| `@granit/blob-storage`                      | Blob storage types and API: `initiateUpload`, `confirmUpload`, `getDownloadUrl`, `deleteBlob`, `getBlob`, `cleanupOrphans` — mirrors `Granit.BlobStorage` .NET                              |
| `@granit/react-blob-storage`                | React hooks for `@granit/blob-storage`: `useBlob`, `useInitiateUpload`, `useConfirmUpload`, `useDeleteBlob`, `useDownloadUrl`, `useCleanupOrphans`, `useBlobUpload`                         |
| `@granit/timeline`                          | Unified activity feed: API functions (`fetchStream`, `createEntry`, `deleteEntry`), types mirroring `Granit.Timeline` .NET contract                                                         |
| `@granit/react-timeline`                    | React bindings for `@granit/timeline`: `TimelineProvider`, `useTimeline`, `useTimelineActions`, `useTimelineFollowers`                                                                      |
| `@granit/cookies`                           | Cookie consent abstraction: types (`CookieConsentProvider` interface, `CookieCategory`, `ConsentState`)                                                                                     |
| `@granit/react-cookies`                     | React bindings for `@granit/cookies`: `CookieConsentProvider`, `useCookieConsent`                                                                                                           |
| `@granit/cookies-klaro`                     | Klaro CMP adapter: `createKlaroCookieConsentProvider` factory                                                                                                                               |
| `@granit/privacy`                           | GDPR privacy types and API: data export, deletion requests, legal agreement management — mirrors `Granit.Privacy` .NET contract                                                             |
| `@granit/react-privacy`                     | React hooks for `@granit/privacy`: `PrivacyProvider`, `usePrivacyExports`, `useRequestExport`, `useDeletionRequests`, `useRequestDeletion`, `useAgreementStatuses`, `useAcceptAgreement`    |
| `@granit/bff`                               | BFF authentication types, CSRF token manager (`CsrfManager`), session API — mirrors `Granit.Bff` .NET contract                                                                              |
| `@granit/react-bff`                         | React bindings for `@granit/bff`: `BffProvider`, `useBffAuth`, `useBffCsrf`, `useBffFetch`, `useBffSessions`, `BffGuard`                                                                    |
| `@granit/workflow`                          | Workflow lifecycle: API functions, types mirroring `Granit.Workflow` .NET contract                                                                                                          |
| `@granit/react-workflow`                    | React bindings for `@granit/workflow`: `WorkflowProvider`, `useTransitions`, `useExecuteTransition`, `useWorkflowHistory`                                                                   |
| `@granit/notifications`                     | Notification core: API functions, `NotificationTransport` interface, extensible `NotificationChannels` constants, types — no React                                                          |
| `@granit/react-notifications`               | React bindings for `@granit/notifications`: `NotificationProvider`, `useNotifications`, `useUnreadCount`, `useRealTimeNotifications`, `useEntityActivityFeed`                               |
| `@granit/notifications-signalr`             | SignalR transport adapter: `createSignalRTransport` factory implementing `NotificationTransport`                                                                                            |
| `@granit/notifications-sse`                 | SSE transport adapter: `createSseTransport` factory implementing `NotificationTransport` via `@microsoft/fetch-event-source`                                                                |
| `@granit/notifications-web-push`            | Web Push VAPID subscription management: `registerPushSubscription`, `unregisterPushSubscription`, `urlBase64ToUint8Array`                                                                   |
| `@granit/react-notifications-web-push`      | React hooks for `@granit/notifications-web-push`: `useWebPush` (permission, subscribe, unsubscribe)                                                                                         |
| `@granit/notifications-mobile-push`         | Mobile Push (FCM/APNs) device token registration: `registerDeviceToken`, `unregisterDeviceToken`, `fetchDeviceTokens`                                                                       |
| `@granit/react-notifications-mobile-push`   | React hooks for `@granit/notifications-mobile-push`: `useMobilePush`, `useDeviceTokens`                                                                                                     |
| `@granit/openiddict-admin`                  | OpenIddict admin management types and API: user/role/group CRUD, OIDC app/scope/authorization management — mirrors `Granit.OpenIddict.Endpoints` .NET                                       |
| `@granit/react-openiddict-admin`            | React hooks for `@granit/openiddict-admin`: `OpenIddictAdminProvider`, `useAdminUsers`, `useAdminRoles`, `useAdminGroups`, `useOidcApplications`, `useOidcScopes`, `useOidcAuthorizations`  |
| `@granit/identity`                          | Identity provider capabilities and admin: user cache, sync, CRUD, roles, groups, sessions, passwords — mirrors `Granit.Identity.Endpoints` .NET                                             |
| `@granit/react-identity`                    | React bindings for `@granit/identity`: `IdentityProvider`, `useIdentityCapabilities`, user/role/group/session hooks                                                                         |
| `@granit/query-engine`                      | Data grid types and utilities: `QueryParams`, `FilterEntry`, `QueryMetadata`, `SavedView` — mirrors `Granit.QueryEngine` .NET contract                                                      |
| `@granit/react-query-engine`                | React bindings for `@granit/query-engine`: `QueryProvider`, `useQueryEndpoint`, `useQueryMeta`, `useSavedViews`, `useSmartFilter`, `usePagination`, `useInfiniteScroll`                     |
| `@granit/data-exchange`                     | Tabular data exchange types and API: export/import types mirroring `Granit.DataExchange` .NET contract                                                                                      |
| `@granit/react-data-exchange`               | React bindings for `@granit/data-exchange`: `ExportProvider`, `ImportProvider`, hooks (`useExportJob`, `useImportJob`, etc.)                                                                |
| `@granit/tracing`                           | Distributed tracing: OpenTelemetry types, `getTraceContext` (non-React, for logger-otlp integration)                                                                                        |
| `@granit/react-tracing`                     | React bindings for `@granit/tracing`: `TracingProvider` (WebTracerProvider + OTLP), `useTracer`, `useSpan`                                                                                  |
| `@granit/multi-tenancy`                     | Multi-tenancy types and tenant resolver: `TenantInfo`, `CurrentTenant`, `TenantResolver`, `resolveTenant`, `createJwtClaimTenantResolver` — mirrors `Granit.MultiTenancy` .NET              |
| `@granit/react-multi-tenancy`               | React bindings for `@granit/multi-tenancy`: `TenantProvider`, `useTenant`, `useKeycloakTenantResolvers` — auto-wires `X-Tenant-Id` header via `@granit/api-client`                          |
| `@granit/error-boundary`                    | Error capture types: `ErrorContextConfig`, `Breadcrumb`, `ErrorContextValue`                                                                                                                |
| `@granit/react-error-boundary`              | React bindings for `@granit/error-boundary`: `GranitErrorBoundary`, `GlobalErrorCapture`, `ErrorContextProvider`, `useBreadcrumb`                                                           |
| `@granit/background-jobs`                   | Background job monitoring types: `BackgroundJobStatus` — mirrors `Granit.BackgroundJobs` .NET                                                                                               |
| `@granit/react-background-jobs`             | React hooks for `@granit/background-jobs`: `useBackgroundJobs`, `usePauseJob`, `useResumeJob`, `useTriggerJob`                                                                              |
| `@granit/reference-data`                    | Reference data types: `Country`, `CountriesListParams` — mirrors `Granit.ReferenceData` .NET                                                                                                |
| `@granit/react-reference-data`              | React hooks for `@granit/reference-data`: `createReferenceDataHooks` factory producing typed `useEntry`, `useList`, `useCreate`, `useUpdate`, `useDeactivate`, `useChildren`                |
| `@granit/templating`                        | Template management types and API: `getTemplates`, `saveDraft`, `publishTemplate`, types — mirrors `Granit.Templating` .NET                                                                 |
| `@granit/react-templating`                  | React bindings for `@granit/templating`: `TemplatingProvider`, `useTemplate`, `useTemplates`, `useTemplateMutations`, `useTemplateCategories`, `useTemplatePreview`, `useTemplateVariables` |
| `@granit/settings`                          | Application settings types — mirrors `Granit.Settings` .NET                                                                                                                                 |
| `@granit/react-settings`                    | React bindings for `@granit/settings`: `SettingsProvider`, `useSetting`, `useUpdateSetting`                                                                                                 |
| `@granit/storage`                           | Storage abstraction: `createStorage<T>` factory (localStorage wrapper with JSON serialization)                                                                                              |
| `@granit/react-storage`                     | React bindings for `@granit/storage`: `useStorage` hook (`useSyncExternalStore`-based)                                                                                                      |
| `@granit/localization`                      | Localization setup: `createLocalization` factory (i18next configuration)                                                                                                                    |
| `@granit/react-localization`                | React bindings for `@granit/localization`: `useLocale` hook (locale management + persistence)                                                                                               |
| `@granit/webhooks`                          | Webhook subscription management types and API: CRUD, lifecycle, secret rotation, test ping, stats — mirrors `Granit.Webhooks` .NET                                                          |
| `@granit/react-webhooks`                    | React hooks for `@granit/webhooks`: `useSubscription`, `useCreateSubscription`, `useDeleteSubscription`, `useActivateSubscription`, `useRotateSecret`, `useTestPing`, `useWebhookStats`     |
| `@granit/ai`                                | AI workspace management, chat completion (sync + streaming), embedding generation, usage tracking — mirrors `Granit.AI` .NET                                                                |
| `@granit/react-ai`                          | React bindings for `@granit/ai`: `AIProvider`, `useAIWorkspaces`, `useAIChat`, `useAIChatStream`, `useAIEmbeddings`                                                                         |
| `@granit/auditing`                          | Audit log types and API: `fetchAuditLogEntries`, `fetchAuditLogEntry`, `fetchEntityAuditTrail` — mirrors `Granit.Auditing` .NET                                                             |
| `@granit/react-auditing`                    | React bindings for `@granit/auditing`: `AuditLogProvider`, `useAuditLogEntries`, `useAuditLogEntry`, `useEntityAuditTrail`                                                                  |
| `@granit/diagnostics`                       | Monitoring health types and API: `fetchMonitoringHealth`, `ServiceHealth`, `MonitoringHealthResponse` — mirrors `Granit.Diagnostics` .NET                                                   |
| `@granit/react-diagnostics`                 | React hooks for `@granit/diagnostics`: `useMonitoringHealth`                                                                                                                                |
| `@granit/features`                          | Feature management types and API: `fetchFeatureDefinitions`, `fetchFeatureValues`, `setFeatureOverride`, `deleteFeatureOverride` — mirrors `Granit.Features` .NET                           |
| `@granit/react-features`                    | React bindings for `@granit/features`: `FeaturesProvider`, `useFeatureFlag`, `useFeatureValue`, `useFeatureDefinitions`, `useSetFeatureOverride`                                            |
| `@granit/validation`                        | OpenAPI constraint extraction, field validation, input prop generation, server-side validation API — mirrors `Granit.Validation` .NET                                                       |
| `@granit/react-validation`                  | React bindings for `@granit/validation`: `createConstraintsResolver`, `useFieldProps`, `useServerValidation`                                                                                |
| `@granit/testing`                           | Shared test utilities: `createMockClient`, `axiosResponse`, `createMockLogger`                                                                                                              |
| `@granit/react-testing`                     | React test utilities: `createTestQueryClient`, `createQueryWrapper` (re-exports `@granit/testing`)                                                                                          |
| `@granit/idempotency`                       | Idempotency key generation: `enableIdempotency`, `disableIdempotency` — mirrors `Granit.Idempotency` .NET                                                                                   |

## Stack & versions

TypeScript 6 (strict, ES2025) | React 19 | Vitest 4 | ESLint 10 | pnpm workspace | Node 24

## Commands

```bash
# Root workspace — runs across all packages
pnpm lint               # ESLint (--max-warnings 0)
pnpm tsc                # TypeScript check (pnpm -r exec tsc --noEmit)
pnpm test               # Vitest (all packages, watch mode)
pnpm test:coverage      # Vitest coverage (v8, lcov + html)

# Per package
pnpm --filter @granit/utils lint
pnpm --filter @granit/authentication test
```

## Package conventions

- **Source-direct**: packages export `.ts` source files — no build step, no `dist/`
- **Exports**: `"exports": { ".": "./src/index.ts" }` in each `package.json`
- **Entry point**: single `src/index.ts` per package (re-exports public API)
- **Tests**: co-located with source `src/**/*.test.ts` or `src/__tests__/`
- **Coverage**: ≥ 80% on all new code — flagged as top priority if below
- **pnpm only** — never npm or yarn

## Coding conventions

Full frontend conventions: `../granit-dotnet/docs/guide/conventions/frontend/`

**Read these files before any structural or convention question:**

- `../granit-dotnet/docs/guide/conventions/frontend/style-et-nommage.md` — TypeScript strict, naming, `type` vs `interface`, exports, imports, ESLint, feature-based organization, **`@granit/*` package subdirectory structure**
- `../granit-dotnet/docs/guide/conventions/frontend/composants.md` — React, TS patterns, shadcn/ui, CVA, Storybook, WCAG, design tokens, performance, HDS security
- `../granit-dotnet/docs/guide/conventions/frontend/etat-et-api.md` — React Query, Query Factory, Orval, auth, routing, logging, i18n, Zod forms, tests

## Tech rules

- **TypeScript strict** on all `.ts`/`.tsx` files — no implicit `any`
- **Logging**: use `@granit/logger` (`createLogger`), never `console.log`
- **Imports**: `import type` for type-only imports
- **Peer dependencies**: declare in `peerDependencies`, not `dependencies`
- **No bundling**: consumed directly as TypeScript source via Vite path aliases

## API design rules

- **API stability**: exported types/function signatures are consumed by showcase-admin-react
  — breaking changes require coordinating updates to the consumer app
- **No app-specific code**: packages must remain app-agnostic
  (no FHIR, no Capacitor, no admin roles, no HDS-specific behavior)
- **`@granit/authentication` base interface**: `BaseAuthContextType` is the shared base
  — provider packages extend it (`KeycloakAuthContextType`, `EntraIdAuthContextType`, etc.)
  — consuming apps extend further with app-specific fields
- **Peer dep matrix** (actual `peerDependencies` from each `package.json`):
  - `@granit/account` → `axios`
  - `@granit/react-account` → `react`, `@tanstack/react-query`, `axios`, `@granit/account`
  - `@granit/utils` → `clsx`, `tailwind-merge`, `date-fns`
  - `@granit/api-client` → `axios`
  - `@granit/blob-storage` → `axios`
  - `@granit/react-blob-storage` → `react`, `axios`, `@tanstack/react-query`, `@granit/blob-storage`
  - `@granit/authentication` → _(no peer dependencies)_
  - `@granit/react-authentication` → `react`, `@granit/authentication`
  - `@granit/authentication-keycloak` → `keycloak-js`, `@granit/authentication`
  - `@granit/react-authentication-keycloak` → `react`, `keycloak-js`, `@granit/api-client`, `@granit/authentication`, `@granit/authentication-keycloak`, `@granit/react-authentication`
  - `@granit/authentication-entraid` → `@azure/msal-browser`, `@granit/authentication`
  - `@granit/react-authentication-entraid` → `react`, `@azure/msal-browser`, `@granit/api-client`, `@granit/authentication`, `@granit/authentication-entraid`, `@granit/react-authentication`
  - `@granit/authentication-cognito` → `amazon-cognito-identity-js`, `@granit/authentication`
  - `@granit/react-authentication-cognito` → `react`, `amazon-cognito-identity-js`, `@granit/api-client`, `@granit/authentication`, `@granit/authentication-cognito`, `@granit/react-authentication`
  - `@granit/authentication-google-cloud` → `firebase`, `@granit/authentication`
  - `@granit/react-authentication-google-cloud` → `react`, `firebase`, `@granit/api-client`, `@granit/authentication`, `@granit/authentication-google-cloud`, `@granit/react-authentication`
  - `@granit/authentication-local` → `axios`
  - `@granit/react-authentication-local` → `react`, `@tanstack/react-query`, `axios`, `@granit/authentication-local`
  - `@granit/authorization` → `axios`
  - `@granit/react-authorization` → `react`, `axios`, `@tanstack/react-query`, `@granit/authorization`
  - `@granit/cookies` → _(no peer dependencies)_
  - `@granit/react-cookies` → `react`, `@granit/cookies`, `@granit/logger`
  - `@granit/cookies-klaro` → `klaro`, `@granit/cookies`
  - `@granit/privacy` → `axios`
  - `@granit/react-privacy` → `react`, `@tanstack/react-query`, `axios`, `@granit/privacy`
  - `@granit/bff` → _(no peer dependencies)_
  - `@granit/react-bff` → `react`, `@granit/bff`
  - `@granit/timeline` → `@granit/query-engine`, `axios`
  - `@granit/react-timeline` → `react`, `axios`, `@granit/logger`, `@granit/query-engine`, `@granit/react-query-engine`, `@granit/timeline`
  - `@granit/workflow` → `@granit/query-engine`, `axios`
  - `@granit/react-workflow` → `react`, `axios`, `@granit/logger`, `@granit/query-engine`, `@granit/workflow`
  - `@granit/notifications` → `@granit/query-engine`, `axios`
  - `@granit/react-notifications` → `react`, `axios`, `@granit/notifications`, `@granit/query-engine`, `@granit/react-query-engine`
  - `@granit/notifications-signalr` → `@granit/notifications`, `@microsoft/signalr`
  - `@granit/notifications-sse` → `@granit/notifications`, `@microsoft/fetch-event-source`
  - `@granit/notifications-web-push` → `axios`
  - `@granit/react-notifications-web-push` → `react`, `axios`, `@granit/notifications-web-push`
  - `@granit/notifications-mobile-push` → `axios`
  - `@granit/react-notifications-mobile-push` → `react`, `axios`, `@capacitor/push-notifications`, `@granit/notifications-mobile-push`, `@tanstack/react-query`
  - `@granit/openiddict-admin` → `@granit/query-engine`, `axios`
  - `@granit/react-openiddict-admin` → `react`, `@tanstack/react-query`, `axios`, `@granit/openiddict-admin`
  - `@granit/query-engine` → `@granit/utils`, `axios`
  - `@granit/react-query-engine` → `react`, `react-dom`, `axios`, `@tanstack/react-query`, `@granit/query-engine`, `@granit/utils`
  - `@granit/data-exchange` → `@granit/query-engine`, `@granit/utils`, `axios`
  - `@granit/react-data-exchange` → `react`, `react-dom`, `axios`, `@tanstack/react-query`, `@granit/data-exchange`, `@granit/query-engine`, `@granit/utils`
  - `@granit/tracing` → `@opentelemetry/api`, `@opentelemetry/instrumentation`
  - `@granit/react-tracing` → `react`, `@granit/tracing`, `@opentelemetry/api`, `@opentelemetry/sdk-trace-web`, `@opentelemetry/exporter-trace-otlp-http`, `@opentelemetry/instrumentation-fetch`, `@opentelemetry/instrumentation-xml-http-request`, `@opentelemetry/instrumentation-document-load`, `@opentelemetry/resources`, `@opentelemetry/semantic-conventions`, `@opentelemetry/context-zone`
  - `@granit/identity` → `@granit/query-engine`, `axios`
  - `@granit/react-identity` → `react`, `axios`, `@tanstack/react-query`, `@granit/identity`
  - `@granit/multi-tenancy` → _(no peer dependencies)_
  - `@granit/react-multi-tenancy` → `react`, `@granit/multi-tenancy`, `@granit/api-client`
  - `@granit/error-boundary` → _(no peer dependencies)_
  - `@granit/react-error-boundary` → `react`, `@granit/logger`, `@granit/error-boundary`
  - `@granit/background-jobs` → `@granit/query-engine`, `axios`
  - `@granit/react-background-jobs` → `react`, `axios`, `@tanstack/react-query`, `@granit/background-jobs`, `@granit/query-engine`
  - `@granit/authentication-api-keys` → _(no peer dependencies)_
  - `@granit/react-authentication-api-keys` → `react`, `axios`, `@tanstack/react-query`, `@granit/authentication-api-keys`
  - `@granit/reference-data` → `@granit/query-engine`, `axios`
  - `@granit/react-reference-data` → `react`, `axios`, `@tanstack/react-query`, `@granit/reference-data`
  - `@granit/templating` → `@granit/query-engine`, `axios`
  - `@granit/react-templating` → `react`, `axios`, `@tanstack/react-query`, `@granit/templating`
  - `@granit/settings` → `axios`
  - `@granit/react-settings` → `react`, `axios`, `@tanstack/react-query`, `@granit/settings`
  - `@granit/storage` → _(no peer dependencies)_
  - `@granit/react-storage` → `react`, `@granit/storage`
  - `@granit/localization` → `@granit/storage`, `axios`, `i18next`
  - `@granit/react-localization` → `react`, `react-i18next`, `i18next`, `@tanstack/react-query`, `axios`, `@granit/localization`, `@granit/storage`
  - `@granit/logger-otlp` → `@granit/logger`
  - `@granit/webhooks` → `axios`
  - `@granit/react-webhooks` → `react`, `axios`, `@tanstack/react-query`, `@granit/webhooks`
  - `@granit/idempotency` → `@granit/api-client`, `axios`
  - `@granit/ai` → `axios`
  - `@granit/react-ai` → `react`, `axios`, `@tanstack/react-query`, `@granit/ai`
  - `@granit/auditing` → `@granit/query-engine`, `axios`
  - `@granit/react-auditing` → `react`, `axios`, `@tanstack/react-query`, `@granit/auditing`, `@granit/query-engine`
  - `@granit/diagnostics` → `axios`
  - `@granit/react-diagnostics` → `react`, `axios`, `@tanstack/react-query`, `@granit/diagnostics`
  - `@granit/features` → `axios`
  - `@granit/react-features` → `react`, `axios`, `@tanstack/react-query`, `@granit/features`
  - `@granit/validation` → `axios`
  - `@granit/react-validation` → `react`, `axios`, `@granit/validation`
  - `@granit/testing` → `axios`, `vitest`
  - `@granit/react-testing` → `react`, `vitest`, `@tanstack/react-query`, `@granit/testing`

## GitHub issues

Before any GitHub operation, **invoke skill `/github`** to load commands and conventions.

- **Types**: Epic (`[EPIC]`), Feature (`[FEATURE]`), Story (`[STORY]`) — no emoji in titles
- **Hierarchy**: references in parent description (GitHub Free has no native sub-tasks)
- **Templates**: `.github/ISSUE_TEMPLATE/`

## Third-party license notices

The file `THIRD-PARTY-NOTICES.md` at the repository root lists every external
dependency with its license type and copyright. This file is a legal obligation
for MIT, Apache-2.0, BSD, ISC, and similar permissive licenses.

**When adding, removing, or upgrading an external dependency:**

1. Update `THIRD-PARTY-NOTICES.md` — add/remove/update the package entry with
   its name, version, license (SPDX identifier), and copyright holder.
2. Update the summary table at the top of the file if license counts change.
3. Update the `Dernière mise à jour` date.
4. If the new dependency uses a **non-permissive license** (GPL, LGPL, AGPL,
   SSPL, or any commercial/non-commercial restriction), **flag it immediately**
   to the user before proceeding. HDS/commercial context requires careful review.

**NEVER** add a dependency without updating `THIRD-PARTY-NOTICES.md`.

## Definition of Done — mandatory before any push

**NEVER push or create an MR** without: tests passing, lint clean (`pnpm lint`),
TypeScript clean (`pnpm tsc`), markdownlint clean on modified `.md` files.
These checks are **blocking**. If the user asks to push without them, remind them
and refuse until the DoD is satisfied or the user explicitly overrides each item.

## Git workflow

- **Branching**: GitFlow (main + develop + `feature/*` + `release/*` + `hotfix/*`)
- **Direct push to `main` FORBIDDEN**
- **Releases**: Semantic tags on main (vMAJOR.MINOR.PATCH), `release/*` branches
- **Commits**: Conventional Commits (feat:, fix:, docs:, chore:) enforced by commitlint
- **MR**: 1 approval minimum for main
- **Pre-commit hooks**: `pnpm lint && pnpm tsc`
- **Commit-msg hook**: `pnpm exec commitlint --edit`

**MR target — STRICT RULE:**

| Branch type | Default target     | Exception                                  |
| ----------- | ------------------ | ------------------------------------------ |
| `feature/*` | `develop`          | Only if user explicitly says "target main" |
| `hotfix/*`  | `main` + `develop` | Both, always                               |
| `release/*` | `main` + `develop` | Both, always                               |
| `fix/*`     | `develop`          | Only if user explicitly says "target main" |

NEVER target `main` for a `feature/*` or `fix/*` branch unless the user explicitly
requests it. When in doubt, ask before creating the MR.

## Security

See `../granit-dotnet/docs/guide/conventions/securite.md` for code-level security rules.

**ALWAYS:**

- No hardcoded secrets (not even in examples or test fixtures)
- No PII propagation through framework utilities
- No US cloud dependencies

**NEVER:**

- Add app-specific constraints (HDS, FHIR) to shared packages
- Introduce side effects at module import time
- Silently swallow errors in library code

## Refactoring — mandatory rules

Any change to a public API (`src/index.ts` exports) may break consumers.

**Before any refactoring:**

1. Check which guava apps import the symbol to be changed
2. Update both apps in the same MR or coordinate in a dedicated issue
3. Never rename exported symbols without a deprecation notice

## Expected behavior

- Understand that this is a framework library — changes affect multiple apps
- Prefer backward-compatible changes; breaking changes need explicit coordination
- Provide production-ready code (no TODOs, no obvious comments)
- Explain the "why" behind architectural choices

## Language

See `../granit-dotnet/docs/guide/conventions/langues.md` for full language and localization rules.

- **Code** (identifiers, JSDoc, comments): **English**
- **Docs, issues, commits**: **French** (with correct diacritics: é, è, ê, à, â, ù, û, ô, î, ï, ç, œ)
- **`CLAUDE.md`, skills**: **English**

## Personas (user stories)

Two persona registries:

- **Infrastructure & governance (15 personas)**: `../governance-compliance/docs/03-organization/ORG-05-PERSONAS.md`
- **Application-level (5 personas)**: `../granit-dotnet/docs/guide/personas-applicatifs.md`

**STRICT RULES:**

- **ALWAYS** use a canonical persona in user stories (`As a [persona]`)
- **NEVER** introduce a new persona without user validation and registry update
- **NEVER** use hybrid roles (`SRE / DevOps`) — choose the primary persona
- Context (on-call, audit, incident) belongs in the story body, not in the persona

## Code index (`.mcp-front-index.json`)

A pre-commit hook regenerates `.mcp-front-index.json` when TypeScript files
in `packages/@granit/*/src/` are staged. This file is consumed by the
`granit-mcp` Worker for code navigation tools (`search_code`,
`get_public_api`, `get_project_graph`).

- **Script:** `python3 scripts/generate-front-index.py` (Python 3.8+, no deps)
- **Hook:** `.husky/pre-commit` — runs automatically on `@granit/*` source changes
- **CI:** drift check validates the file is up to date
- **NEVER edit `.mcp-front-index.json` manually** — always regenerate

**Infra/governance personas:** SRE, Ingénieur DevOps, Développeur, Architecte, DBA,
RSSI, DPO, CTO, Direction, Directeur juridique, Auditeur interne, Auditeur externe,
Utilisateur, Professionnel de santé, Product Owner

**Application personas:** Visiteur, Utilisateur authentifié, Administrateur d'application,
Approbateur, Gestionnaire de contenu
