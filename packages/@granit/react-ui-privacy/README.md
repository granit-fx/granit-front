# @granit/react-ui-privacy

Admin UI for the **Privacy** module — GDPR/CCPA self-service and DSR administration:

- **Data export** (`PrivacyExportPage`) — request a personal-data archive,
  download completed exports, browse available export scopes and trigger an
  export on behalf of another subject.
- **Account deletion** (`PrivacyDeletionPage`) — request immediate or deferred
  (30-day cooling-off) deletion, with the cancellable deletion-request table.
- **Legal agreements** (`PrivacyAgreementsPage`) — accept required legal
  documents and view per-document acceptance history.
- **Regulation profile** (`PrivacyRegulationPage`) — read-only regulation
  profile and declared processing purposes.
- **CCPA opt-out** (`PrivacyOptOutPage`) — Do-Not-Sell-or-Share preference.
- **Admin DSR** (`PrivacyAdminDsrPage`) — export on behalf of a subject.
- **Legal document admin** (`LegalDocumentListPage` / `LegalDocumentCreatePage` /
  `LegalDocumentEditPage`) — zod-validated CRUD over legal documents with
  draft/publish lifecycle.

The **visual** layer for privacy: it composes the headless
[`@granit/react-privacy`](../react-privacy) (provider + hooks) with the
foundation UI packages ([`@granit/react-ui`](../react-ui)) and gates management
actions with [`@granit/react-authorization`](../react-authorization)
`usePermissions`.

## Usage

```tsx
import { PrivacyExportPage, privacyTranslationsEn } from '@granit/react-ui-privacy';

i18n.addResourceBundle('en', 'translation', privacyTranslationsEn, true, true);

// Mount under a PrivacyProvider (from @granit/react-privacy) and a router:
<Route path="/privacy/export" element={<PrivacyExportPage />} />;
```

## Injection

- **API client** — resolved from a `GranitClientProvider` / `PrivacyProvider`
  higher in the tree (via the `@granit/react-privacy` hooks and the
  `usePrivacyConfig` client for streamed export downloads). No client baked in.
- **Permissions** — `usePermissions` from `@granit/react-authorization` gates the
  legal-document create / manage / publish actions
  (`Privacy.LegalDocuments.Create` / `.Manage`).
- **Routing** — the legal-document pages use `react-router-dom`
  (`Link` / `useNavigate` / `useParams` / `useSearchParams`); mount them under a
  router.
- **i18n** — ships its `Privacy.*` strings (`privacyTranslationsEn/Fr`); the
  host registers them.
