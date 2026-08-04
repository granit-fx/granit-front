# @granit/react-ui-privacy

Admin UI feature kit for the Granit **Privacy** module — GDPR/CCPA self-service
and DSR (Data Subject Request) administration. This is the **`react-ui` layer**:
ready-to-mount pages and components that compose the headless
[`@granit/react-privacy`](../react-privacy) hooks/provider with the foundation UI
([`@granit/react-ui`](../react-ui)) and gate management actions through
[`@granit/react-authorization`](../react-authorization) `usePermissions`. It owns
the rendering — buttons, tables, dialogs, and zod-validated forms — and ships the
module's `Privacy.*` i18n bundles.

The split is three packages over the same .NET `Granit.Privacy` backend
(contract: `contracts/openapi/privacy.json`):

- [`@granit/privacy`](../privacy) — framework-agnostic core: DTOs + Axios calls
  (`downloadExport`, export/deletion/agreement/regulation/opt-out + legal-document
  contracts).
- [`@granit/react-privacy`](../react-privacy) — React Query hooks + `PrivacyProvider`
  (`usePrivacyExports`, `useRequestDeletion`, `useLegalDocuments`, …).
- `@granit/react-ui-privacy` (this package) — the visual admin/self-service screens.

The surface covers seven areas:

- **Data export** (`PrivacyExportPage`) — request a personal-data archive, browse
  available export scopes, download completed archives, and trigger an export on
  behalf of another subject.
- **Account deletion** (`PrivacyDeletionPage` + `DeletionRequestTable`) — request
  immediate or deferred (cooling-off) deletion, with the cancellable request table.
- **Legal agreements** (`PrivacyAgreementsPage`) — accept required legal documents
  and view per-document acceptance history.
- **Regulation profile** (`PrivacyRegulationPage`) — read-only regulation profile
  (consent model, SAR/deletion deadlines, GPC) plus declared processing purposes.
- **CCPA opt-out** (`PrivacyOptOutPage`) — Do-Not-Sell-or-Share preference.
- **Admin DSR** (`PrivacyAdminDsrPage`) — export on behalf of a subject by user id.
- **Legal-document admin** (`LegalDocumentListPage` / `LegalDocumentCreatePage` /
  `LegalDocumentEditPage`) — zod-validated CRUD with a draft → publish lifecycle.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
for app consumption through a public registry. (Unlike the headless layer, this kit
also ships a `tsup` build to `npm.pkg.github.com`.) A consumer must declare these
peers:

- `@granit/privacy` — core DTOs + the `downloadExport` Axios helper.
- `@granit/react-privacy` — `PrivacyProvider` + hooks this kit renders; must wrap the
  mounted pages.
- `@granit/react-authorization` — `usePermissions`, gates create/manage/publish.
- `@granit/react-ui` — the shadcn/ui foundation (`Card`, `Table`, `Form`, `Dialog`, …).
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/utils` — `cn` class-name helper.
- `@granit/logger` — `createLogger` for the mutation-failure log paths.
- `react` / `react-dom` (`^19`) and `react-router` (`^8`) — the legal-document
  pages use `Link` / `useNavigate` / `useParams` / `useSearchParams`.
- `react-hook-form` (`^7`), `@hookform/resolvers` (`^5`), `zod` (`^4`) — the
  legal-document forms.
- `@tanstack/react-table` (`^8`) — the legal-document list grid.
- `lucide-react` (`^1`) — icons.

## Quick start

Register the i18n bundle, mount the pages under a `PrivacyProvider` (from
`@granit/react-privacy`) and a router. The admin/legal-document screens additionally
need an `AuthorizationProvider` in scope for the permission gates to resolve.

```tsx
import { PrivacyProvider } from '@granit/react-privacy';
import { AuthorizationProvider } from '@granit/react-authorization';
import {
  PrivacyExportPage,
  PrivacyDeletionPage,
  PrivacyAgreementsPage,
  PrivacyOptOutPage,
  LegalDocumentListPage,
  LegalDocumentCreatePage,
  LegalDocumentEditPage,
  privacyTranslationsEn,
} from '@granit/react-ui-privacy';
import { useGranitClient } from '@granit/react-api-client';
import { Route, Routes } from 'react-router';

i18n.addResourceBundle('en', 'translation', privacyTranslationsEn, true, true);

function PrivacyArea() {
  const client = useGranitClient();
  return (
    <PrivacyProvider config={{ client }}>
      <AuthorizationProvider config={{ client }}>
        <Routes>
          <Route path="export" element={<PrivacyExportPage />} />
          <Route path="deletion" element={<PrivacyDeletionPage />} />
          <Route path="agreements" element={<PrivacyAgreementsPage />} />
          <Route path="opt-out" element={<PrivacyOptOutPage />} />
          <Route path="legal-documents" element={<LegalDocumentListPage />} />
          <Route path="legal-documents/new" element={<LegalDocumentCreatePage />} />
          <Route path="legal-documents/:id/edit" element={<LegalDocumentEditPage />} />
        </Routes>
      </AuthorizationProvider>
    </PrivacyProvider>
  );
}
```

The legal-document pages assume the `/privacy/legal-documents` route prefix used in
their internal `Link` / `useNavigate` calls (list ↔ `new` ↔ `:id/edit`); mount them
under that path so the cross-links resolve. The list filters by `?documentId=` via
`useSearchParams`. Standalone components can be embedded directly:

```tsx
import {
  DeletionRequestTable,
  DeletionStatusBadge,
  LegalDocumentForm,
  LegalDocumentStatusBadge,
  useLegalDocumentColumns,
  createLegalDocumentSchema,
} from '@granit/react-ui-privacy';
```

## Public API

| Symbol                          | Kind      | Purpose                                                             |
| ------------------------------- | --------- | ------------------------------------------------------------------- |
| `PrivacyExportPage`             | component | Request/list/download personal-data exports + scopes + on-behalf-of |
| `PrivacyDeletionPage`           | component | Request immediate/deferred deletion; embeds `DeletionRequestTable`  |
| `PrivacyAgreementsPage`         | component | Accept required legal documents; per-document acceptance history    |
| `PrivacyRegulationPage`         | component | Read-only regulation profile + declared processing purposes         |
| `PrivacyOptOutPage`             | component | CCPA Do-Not-Sell-or-Share opt-out preference + status               |
| `PrivacyAdminDsrPage`           | component | Admin DSR — export on behalf of a subject by user id                |
| `LegalDocumentListPage`         | component | Legal-document grid; filter, view-versions, edit/publish menu       |
| `LegalDocumentCreatePage`       | component | Create a legal document (`create` mode of `LegalDocumentForm`)      |
| `LegalDocumentEditPage`         | component | Edit a draft document; redirects away from non-draft states         |
| `DeletionRequestTable`          | component | Deletion-request table with cancel action for deferred requests     |
| `DeletionStatusBadge`           | component | Status badge for a `DeletionState`                                  |
| `LegalDocumentForm`             | component | Discriminated `create`/`edit` zod-resolved form                     |
| `LegalDocumentPublishDialog`    | component | Confirm dialog wrapping the publish mutation                        |
| `LegalDocumentStatusBadge`      | component | Status badge for a `LegalDocumentLifecycleStatus`                   |
| `useLegalDocumentColumns`       | hook      | `ColumnDef[]` factory for the grid; gates actions on permissions    |
| `createLegalDocumentSchema`     | const     | Zod schema for create (slug-validated `documentId`)                 |
| `editLegalDocumentSchema`       | const     | Zod schema for edit (carries `concurrencyStamp`)                    |
| `CreateLegalDocumentFormValues` | type      | `z.infer` of `createLegalDocumentSchema`                            |
| `EditLegalDocumentFormValues`   | type      | `z.infer` of `editLegalDocumentSchema`                              |
| `privacyTranslationsEn`         | const     | English `Privacy.*` i18n bundle (host registers it)                 |
| `privacyTranslationsFr`         | const     | French `Privacy.*` i18n bundle                                      |

## Out of scope / caveats

- **Permissions are a UX gate, not enforcement.** `usePermissions` only hides the
  create/edit/publish controls (`Privacy.LegalDocuments.Create` / `.Manage`); the
  on-behalf-of export surface documents `Privacy.Exports.ExecuteOnBehalfOf`. The
  `Granit.Privacy` backend re-checks authorization on every endpoint — never treat a
  hidden control as a security boundary. See
  [`@granit/react-authorization`](../react-authorization) for the full security model.
- **Headless logic lives one layer down.** All data fetching, mutations, query keys,
  and the `client` / `basePath` config come from [`@granit/react-privacy`](../react-privacy)
  hooks and `usePrivacyConfig`; DTOs and the `downloadExport` transport are
  [`@granit/privacy`](../privacy). This package renders them and holds no Axios call of
  its own beyond the streamed-export download helper.
- **Export download is a client-side blob, not a script sink.** `PrivacyExportPage`
  streams the archive via `downloadExport`, wraps it in a `Blob`, and triggers a
  download through an `<a download>` + `URL.createObjectURL` (revoked after the click).
  It writes no `innerHTML` / `src` script sink, so no `@granit/react-ui-privacy/csp`
  subpath is required (`pnpm check:csp`).
- **Optimistic concurrency on edit.** `editLegalDocumentSchema` carries a
  `concurrencyStamp` round-tripped from the detail response into the update body
  (body-field convention, not `If-Match`); editing is restricted to `Draft` documents
  (the edit page redirects away from non-draft states).
- **i18n is the host's job.** The kit ships `privacyTranslationsEn` / `Fr` and reads
  every label through `useTranslation`; the host registers the bundle (many strings
  have inline `defaultValue` fallbacks, but the bundle is authoritative).

## License

Apache-2.0
