# CLAUDE.md - Granit Front

## Project

- **Type**: TypeScript/React framework library — packages `@granit/*`
- **Purpose**: Shared framework for Digital Dynamics front-end applications (guava-front, guava-admin)
- **Equivalent**: JavaScript/TypeScript counterpart of `granit-dotnet` (.NET framework)
- **Location**: this repository root
- **Consumers**: guava-front, guava-admin (via pnpm `link:` protocol + Vite aliases)

## Packages

| Package                                   | Purpose                                                                                                                                                                                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@granit/account`                         | Account self-service types and API: registration, profile, password, 2FA/TOTP, external logins, passkeys/WebAuthn, session, deletion — mirrors `Granit.OpenIddict.Endpoints` .NET contract                                                    |
| `@granit/react-account`                   | React hooks for `@granit/account`: `AccountProvider`, `useProfile`, `useRegister`, `useChangePassword`, `useTwoFactorStatus`, `usePasskeys`, `useExternalLogins`, `useSessionHeartbeat`, `useDeleteAccount`                                   |
| `@granit/logger`                          | Configurable logger factory (`createLogger(prefix)`)                                                                                                                                                                                          |
| `@granit/utils`                           | Shared utilities (`cn`, `formatDate`, `formatNumber`, …)                                                                                                                                                                                      |
| `@granit/api-client`                      | Axios factory (`createApiClient`, `setTokenGetter`), shared response types (`ProblemDetails`), error classes (`HttpError`, `ValidationError`, `TimeoutError`)                                                                                 |
| `@granit/blob-storage`                    | Blob storage types and API functions: `initiateUpload`, `confirmUpload`, `getDownloadUrl`, `deleteBlob`, `getBlob`, `cleanupOrphans` — mirrors `Granit.BlobStorage` .NET contract                                                             |
| `@granit/react-blob-storage`              | React hooks for `@granit/blob-storage`: `useBlob`, `useInitiateUpload`, `useConfirmUpload`, `useDeleteBlob`, `useDownloadUrl`, `useCleanupOrphans`, `useBlobUpload` (orchestration)                                                           |
| `@granit/authentication`                  | Keycloak/OIDC authentication types: `BaseAuthContextType`, `KeycloakUserInfo`, `KeycloakCoreConfig`, `LoginOptions`, `LogoutOptions` — mirrors `Granit.Authentication` .NET                                                                   |
| `@granit/react-authentication`            | React bindings for `@granit/authentication`: `useKeycloakInit`, `createAuthContext`, `createMockProvider`                                                                                                                                     |
| `@granit/authorization`                   | Permission/role authorization types: `PermissionsResponse`, `PermissionDefinitionDto`, `PermissionGroupDto`, `PermissionGrantDto` — mirrors `Granit.Authorization` .NET                                                                       |
| `@granit/react-authorization`             | React hooks for `@granit/authorization`: `usePermissions`, `usePermissionDefinitions`, `useRolePermissions`, `usePermissionGrant`                                                                                                             |
| `@granit/timeline`                        | Unified activity feed: API functions (`fetchStream`, `createEntry`, `deleteEntry`), types mirroring `Granit.Timeline` .NET contract                                                                                                           |
| `@granit/react-timeline`                  | React bindings for `@granit/timeline`: `TimelineProvider`, `useTimeline`, `useTimelineActions`, `useTimelineFollowers`                                                                                                                        |
| `@granit/cookies`                         | Cookie consent abstraction: types (`CookieConsentProvider` interface, `CookieCategory`, `ConsentState`)                                                                                                                                       |
| `@granit/react-cookies`                   | React bindings for `@granit/cookies`: `CookieConsentProvider`, `useCookieConsent`                                                                                                                                                             |
| `@granit/cookies-klaro`                   | Klaro CMP adapter: `createKlaroCookieConsentProvider` factory                                                                                                                                                                                 |
| `@granit/privacy`                         | GDPR privacy types and API: data export, deletion requests, legal agreement management — mirrors `Granit.Privacy` .NET contract                                                                                                               |
| `@granit/react-privacy`                   | React hooks for `@granit/privacy`: `PrivacyProvider`, `usePrivacyExports`, `useRequestExport`, `useDeletionRequests`, `useRequestDeletion`, `useAgreementStatuses`, `useAcceptAgreement`                                                      |
| `@granit/bff`                             | BFF authentication types, CSRF token manager (`CsrfManager`), session API — mirrors `Granit.Bff` .NET contract                                                                                                                                |
| `@granit/react-bff`                       | React bindings for `@granit/bff`: `BffProvider`, `useBffAuth`, `useBffCsrf`, `useBffFetch`, `useBffSessions`, `BffGuard`                                                                                                                      |
| `@granit/workflow`                        | Workflow lifecycle: API functions, types mirroring `Granit.Workflow` .NET contract                                                                                                                                                            |
| `@granit/react-workflow`                  | React bindings for `@granit/workflow`: `WorkflowProvider`, `useWorkflowStatus`, `useWorkflowTransition`, `useWorkflowHistory`                                                                                                                 |
| `@granit/notifications`                   | Notification core: API functions, `NotificationTransport` interface, extensible `NotificationChannels` constants, types — no React                                                                                                            |
| `@granit/react-notifications`             | React bindings for `@granit/notifications`: `NotificationProvider`, `useNotifications`, `useUnreadCount`, `useRealTimeNotifications`, `useEntityActivityFeed`, `useNotificationPreferences`                                                   |
| `@granit/notifications-signalr`           | SignalR transport adapter: `createSignalRTransport` factory implementing `NotificationTransport`                                                                                                                                              |
| `@granit/notifications-sse`               | SSE transport adapter: `createSseTransport` factory implementing `NotificationTransport` via `@microsoft/fetch-event-source`                                                                                                                  |
| `@granit/notifications-web-push`          | Web Push VAPID subscription management: `registerPushSubscription`, `unregisterPushSubscription`, `urlBase64ToUint8Array`                                                                                                                     |
| `@granit/react-notifications-web-push`    | React hooks for `@granit/notifications-web-push`: `useWebPush` (permission, subscribe, unsubscribe)                                                                                                                                           |
| `@granit/notifications-mobile-push`       | Mobile Push (FCM/APNs) device token registration: `registerDeviceToken`, `unregisterDeviceToken`, `fetchDeviceTokens`                                                                                                                         |
| `@granit/react-notifications-mobile-push` | React hooks for `@granit/notifications-mobile-push`: `useMobilePush`, `useDeviceTokens`                                                                                                                                                       |
| `@granit/openiddict-admin`                | OpenIddict admin management types and API: user/role/group CRUD, OIDC application/scope/authorization management — mirrors `Granit.OpenIddict.Endpoints` .NET                                                                                 |
| `@granit/react-openiddict-admin`          | React hooks for `@granit/openiddict-admin`: `OpenIddictAdminProvider`, `useAdminUsers`, `useAdminRoles`, `useAdminGroups`, `useOidcApplications`, `useOidcScopes`, `useOidcAuthorizations`                                                    |
| `@granit/querying`                        | Data grid types and utilities: `QueryParams`, `FilterEntry`, `QueryMetadata`, `SavedView` — types mirroring `Granit.Querying` .NET contract                                                                                                   |
| `@granit/react-querying`                  | React bindings for `@granit/querying`: `QueryProvider`, `useQueryEndpoint`, `useQueryMeta`, `useSavedViews`, `useSmartFilter`, `usePagination`, `useInfiniteScroll`                                                                           |
| `@granit/data-exchange`                   | Tabular data exchange types and API: export/import types mirroring `Granit.DataExchange` .NET contract                                                                                                                                        |
| `@granit/react-data-exchange`             | React bindings for `@granit/data-exchange`: `ExportProvider`, `ImportProvider`, hooks (`useExportJob`, `useImportJob`, etc.)                                                                                                                  |
| `@granit/tracing`                         | Distributed tracing: OpenTelemetry types, `getTraceContext` (non-React, for logger-otlp integration)                                                                                                                                          |
| `@granit/react-tracing`                   | React bindings for `@granit/tracing`: `TracingProvider` (WebTracerProvider + OTLP), `useTracer`, `useSpan`                                                                                                                                    |
| `@granit/identity`                        | Identity provider capabilities: types (`IdentityProviderCapabilities`) and API (`fetchIdentityCapabilities`) mirroring `Granit.Identity` .NET contract                                                                                        |
| `@granit/react-identity`                  | React bindings for `@granit/identity`: `IdentityProvider`, `useIdentityCapabilities`                                                                                                                                                          |
| `@granit/multi-tenancy`                   | Multi-tenancy types and tenant resolver abstraction: `TenantInfo`, `CurrentTenant`, `MultiTenancyOptions`, `TenantResolver` interface, `resolveTenant` pipeline, `createJwtClaimTenantResolver` — mirrors `Granit.MultiTenancy` .NET contract |
| `@granit/react-multi-tenancy`             | React bindings for `@granit/multi-tenancy`: `TenantProvider`, `useTenant`, `useKeycloakTenantResolvers` — auto-wires `X-Tenant-Id` header via `@granit/api-client`                                                                            |
| `@granit/error-boundary`                  | Error capture types: `ErrorContextConfig`, `Breadcrumb`, `ErrorContextValue`                                                                                                                                                                  |
| `@granit/react-error-boundary`            | React bindings for `@granit/error-boundary`: `GranitErrorBoundary`, `GlobalErrorCapture`, `ErrorContextProvider`, `useBreadcrumb`                                                                                                             |
| `@granit/background-jobs`                 | Background job monitoring types: `BackgroundJobStatus` — mirrors `Granit.BackgroundJobs` .NET                                                                                                                                                 |
| `@granit/react-background-jobs`           | React hooks for `@granit/background-jobs`: `useBackgroundJobs`, `usePauseJob`, `useResumeJob`, `useTriggerJob`                                                                                                                                |
| `@granit/authentication-api-keys`         | API key management types: `ApiKeyResponse`, `ApiKeyCreateRequest`, `ApiKeyCreateResponse`, `ApiKeyRotateResponse` — mirrors `Granit.Authentication.ApiKeys` .NET                                                                              |
| `@granit/react-authentication-api-keys`   | React hooks for `@granit/authentication-api-keys`: `useApiKeys`, `useApiKey`, `useCreateApiKey`, `useRevokeApiKey`, `useRotateApiKey`, `useUpdateApiKeyScopes`                                                                                |
| `@granit/reference-data`                  | Reference data types: `Country`, `CountriesListParams` — mirrors `Granit.ReferenceData` .NET                                                                                                                                                  |
| `@granit/react-reference-data`            | React hooks for `@granit/reference-data`: `useCountry`, `useCountries`, `useCreateCountry`, `useUpdateCountry`, `useDeactivateCountry`, `useReactivateCountry`                                                                                |
| `@granit/templating`                      | Template management types and API functions: `getTemplates`, `saveDraft`, `publishTemplate`, types — mirrors `Granit.Templating` .NET                                                                                                         |
| `@granit/react-templating`                | React bindings for `@granit/templating`: `TemplatingProvider`, `useTemplate`, `useTemplates`, `useTemplateMutations`, `useTemplateCategories`, `useTemplatePreview`, `useTemplateVariables`                                                   |
| `@granit/settings`                        | Application settings types — mirrors `Granit.Settings` .NET                                                                                                                                                                                   |
| `@granit/react-settings`                  | React bindings for `@granit/settings`: `SettingsProvider`, `useSetting`, `useUpdateSetting`                                                                                                                                                   |
| `@granit/storage`                         | Storage abstraction: `createStorage<T>` factory (localStorage wrapper with JSON serialization)                                                                                                                                                |
| `@granit/react-storage`                   | React bindings for `@granit/storage`: `useStorage` hook (`useSyncExternalStore`-based)                                                                                                                                                        |
| `@granit/localization`                    | Localization setup: `createLocalization` factory (i18next configuration)                                                                                                                                                                      |
| `@granit/react-localization`              | React bindings for `@granit/localization`: `useLocale` hook (locale management + persistence)                                                                                                                                                 |
| `@granit/logger-otlp`                     | OpenTelemetry log transport: `createOtlpTransport` for `@granit/logger`                                                                                                                                                                       |
| `@granit/webhooks`                        | Webhook subscription management types and API functions: CRUD, lifecycle (activate/suspend/deactivate), secret rotation, test ping, stats — mirrors `Granit.Webhooks` .NET                                                                    |
| `@granit/react-webhooks`                  | React hooks for `@granit/webhooks`: `useSubscription`, `useCreateSubscription`, `useDeleteSubscription`, `useActivateSubscription`, `useRotateSecret`, `useTestPing`, `useDeliveries`, `useWebhookStats`                                      |
| `@granit/ai`                              | AI workspace management, chat completion (sync + streaming), embedding generation, usage tracking — mirrors `Granit.AI` .NET                                                                                                                  |
| `@granit/react-ai`                        | React bindings for `@granit/ai`: `AIProvider`, `useAIWorkspaces`, `useAIChat`, `useAIChatStream`, `useAIEmbeddings`                                                                                                                           |
| `@granit/audit-log`                       | Audit log types and API: `fetchAuditLogEntries`, `fetchAuditLogEntry`, `fetchEntityAuditTrail` — mirrors `Granit.AuditLog` .NET                                                                                                               |
| `@granit/react-audit-log`                 | React bindings for `@granit/audit-log`: `AuditLogProvider`, `useAuditLogEntries`, `useAuditLogEntry`, `useEntityAuditTrail`                                                                                                                   |
| `@granit/diagnostics`                     | Monitoring health types and API: `fetchMonitoringHealth`, `ServiceHealth`, `MonitoringHealthResponse` — mirrors `Granit.Diagnostics` .NET                                                                                                     |
| `@granit/react-diagnostics`               | React hooks for `@granit/diagnostics`: `useMonitoringHealth`                                                                                                                                                                                  |
| `@granit/features`                        | Feature management types and API: `fetchFeatureDefinitions`, `fetchFeatureValues`, `setFeatureOverride`, `deleteFeatureOverride` — mirrors `Granit.Features` .NET                                                                             |
| `@granit/react-features`                  | React bindings for `@granit/features`: `FeaturesProvider`, `useFeatureFlag`, `useFeatureValue`, `useFeatureDefinitions`, `useSetFeatureOverride`                                                                                              |
| `@granit/validation`                      | OpenAPI constraint extraction, field validation, input prop generation, server-side validation API — mirrors `Granit.Validation` .NET                                                                                                         |
| `@granit/react-validation`                | React bindings for `@granit/validation`: `createConstraintsResolver`, `useFieldProps`, `useServerValidation`                                                                                                                                  |
| `@granit/testing`                         | Shared test utilities: `createMockClient`, `axiosResponse`, `createMockLogger`                                                                                                                                                                |
| `@granit/react-testing`                   | React test utilities: `createTestQueryClient`, `createQueryWrapper` (re-exports `@granit/testing`)                                                                                                                                            |
| `@granit/idempotency`                     | Idempotency key generation: `createIdempotencyKey` — mirrors `Granit.Idempotency` .NET                                                                                                                                                        |

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

- **API stability**: exported types/function signatures are consumed by multiple apps
  — breaking changes require coordinating updates to both guava-front and guava-admin
- **No app-specific code**: packages must remain app-agnostic
  (no FHIR, no Capacitor, no admin roles, no HDS-specific behavior)
- **`@granit/authentication` base interface**: `BaseAuthContextType` is the shared base
  — apps extend it with their own fields (`register` in front, `hasAdminRole` in admin)
- **Peer dep matrix** (actual `peerDependencies` from each `package.json`):
  - `@granit/account` → `axios`
  - `@granit/react-account` → `react`, `@tanstack/react-query`, `axios`, `@granit/account`
  - `@granit/utils` → `clsx`, `tailwind-merge`, `date-fns`
  - `@granit/api-client` → `axios`
  - `@granit/blob-storage` → `axios`
  - `@granit/react-blob-storage` → `react`, `axios`, `@tanstack/react-query`, `@granit/blob-storage`
  - `@granit/authentication` → `keycloak-js`
  - `@granit/react-authentication` → `react`, `keycloak-js`, `@granit/api-client`, `@granit/authentication`
  - `@granit/authorization` → `axios`
  - `@granit/react-authorization` → `react`, `axios`, `@tanstack/react-query`, `@granit/authorization`
  - `@granit/cookies` → _(no peer dependencies)_
  - `@granit/react-cookies` → `react`, `@granit/cookies`, `@granit/logger`
  - `@granit/cookies-klaro` → `klaro`, `@granit/cookies`
  - `@granit/privacy` → `axios`
  - `@granit/react-privacy` → `react`, `@tanstack/react-query`, `axios`, `@granit/privacy`
  - `@granit/bff` → _(no peer dependencies)_
  - `@granit/react-bff` → `react`, `@granit/bff`
  - `@granit/timeline` → `@granit/querying`, `axios`
  - `@granit/react-timeline` → `react`, `axios`, `@granit/logger`, `@granit/querying`, `@granit/react-querying`, `@granit/timeline`
  - `@granit/workflow` → `@granit/querying`, `axios`
  - `@granit/react-workflow` → `react`, `axios`, `@granit/logger`, `@granit/querying`, `@granit/workflow`
  - `@granit/notifications` → `@granit/querying`, `axios`
  - `@granit/react-notifications` → `react`, `axios`, `@granit/notifications`, `@granit/querying`, `@granit/react-querying`
  - `@granit/notifications-signalr` → `@granit/notifications`, `@microsoft/signalr`
  - `@granit/notifications-sse` → `@granit/notifications`, `@microsoft/fetch-event-source`
  - `@granit/notifications-web-push` → `axios`
  - `@granit/react-notifications-web-push` → `react`, `axios`, `@granit/notifications-web-push`
  - `@granit/notifications-mobile-push` → `axios`
  - `@granit/react-notifications-mobile-push` → `react`, `axios`, `@capacitor/push-notifications`, `@granit/notifications-mobile-push`, `@tanstack/react-query`
  - `@granit/openiddict-admin` → `@granit/querying`, `axios`
  - `@granit/react-openiddict-admin` → `react`, `@tanstack/react-query`, `axios`, `@granit/openiddict-admin`
  - `@granit/querying` → `@granit/utils`, `axios`
  - `@granit/react-querying` → `react`, `react-dom`, `axios`, `@tanstack/react-query`, `@granit/querying`, `@granit/utils`
  - `@granit/data-exchange` → `@granit/querying`, `@granit/utils`, `axios`
  - `@granit/react-data-exchange` → `react`, `react-dom`, `axios`, `@tanstack/react-query`, `@granit/data-exchange`, `@granit/querying`, `@granit/utils`
  - `@granit/tracing` → `@opentelemetry/api`, `@opentelemetry/instrumentation`
  - `@granit/react-tracing` → `react`, `@granit/tracing`, `@opentelemetry/api`, `@opentelemetry/sdk-trace-web`, `@opentelemetry/exporter-trace-otlp-http`, `@opentelemetry/instrumentation-fetch`, `@opentelemetry/instrumentation-xml-http-request`, `@opentelemetry/instrumentation-document-load`, `@opentelemetry/resources`, `@opentelemetry/semantic-conventions`, `@opentelemetry/context-zone`
  - `@granit/identity` → `@granit/querying`, `axios`
  - `@granit/react-identity` → `react`, `axios`, `@tanstack/react-query`, `@granit/identity`
  - `@granit/multi-tenancy` → _(no peer dependencies)_
  - `@granit/react-multi-tenancy` → `react`, `@granit/multi-tenancy`, `@granit/api-client`
  - `@granit/error-boundary` → _(no peer dependencies)_
  - `@granit/react-error-boundary` → `react`, `@granit/logger`, `@granit/error-boundary`
  - `@granit/background-jobs` → `@granit/querying`, `axios`
  - `@granit/react-background-jobs` → `react`, `axios`, `@tanstack/react-query`, `@granit/background-jobs`, `@granit/querying`
  - `@granit/authentication-api-keys` → _(no peer dependencies)_
  - `@granit/react-authentication-api-keys` → `react`, `axios`, `@tanstack/react-query`, `@granit/authentication-api-keys`
  - `@granit/reference-data` → `@granit/querying`, `axios`
  - `@granit/react-reference-data` → `react`, `axios`, `@tanstack/react-query`, `@granit/reference-data`
  - `@granit/templating` → `@granit/querying`, `axios`
  - `@granit/react-templating` → `react`, `axios`, `@tanstack/react-query`, `@granit/templating`
  - `@granit/settings` → `axios`
  - `@granit/react-settings` → `react`, `axios`, `@tanstack/react-query`, `@granit/settings`
  - `@granit/storage` → _(no peer dependencies)_
  - `@granit/react-storage` → `react`, `@granit/storage`
  - `@granit/localization` → `@granit/storage`, `i18next`
  - `@granit/react-localization` → `react`, `react-i18next`, `i18next`, `@granit/localization`, `@granit/storage`
  - `@granit/logger-otlp` → `@granit/logger`
  - `@granit/webhooks` → `axios`
  - `@granit/react-webhooks` → `react`, `axios`, `@tanstack/react-query`, `@granit/webhooks`
  - `@granit/idempotency` → `@granit/api-client`, `axios`
  - `@granit/ai` → `axios`
  - `@granit/react-ai` → `react`, `axios`, `@tanstack/react-query`, `@granit/ai`
  - `@granit/audit-log` → `@granit/querying`, `axios`
  - `@granit/react-audit-log` → `react`, `axios`, `@tanstack/react-query`, `@granit/audit-log`
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
