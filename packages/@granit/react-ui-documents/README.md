# @granit/react-ui-documents

Admin UI for the **Documents** module — the documents explorer (folder tree,
list / grid views, upload, inspector, quota badge), the per-document detail view
(versions, shares, tags / categories) and the supporting pages: metadata
(properties), public links, renditions, asset resolution, trash bin and
storage-quota.

The **visual** layer for documents: it composes the headless
[`@granit/react-documents`](../react-documents) (providers + hooks + label-driven
components) with the foundation UI packages ([`@granit/react-ui`](../react-ui)),
the taxonomy widgets ([`@granit/react-taxonomy`](../react-taxonomy) +
[`@granit/react-ui-taxonomy`](../react-ui-taxonomy)) and gates management actions
with [`@granit/react-authorization`](../react-authorization) `usePermissions`.

## Usage

```tsx
import {
  DocumentsExplorerPage,
  DocumentDetailPage,
  documentsAdminTranslationsEn,
} from '@granit/react-ui-documents';

i18n.addResourceBundle('en', 'translation', documentsAdminTranslationsEn, true, true);

// Mount under a GranitClientProvider (the headless components resolve the Axios
// client + DocumentsProvider config from the tree):
<Route path="/documents" element={<DocumentsExplorerPage />} />;
<Route path="/documents/:id" element={<DocumentDetailPage />} />;
<Route path="/documents/:id/metadata" element={<DocumentPropertiesPage />} />;
<Route path="/documents/:id/public-links" element={<DocumentPublicLinksPage />} />;
<Route path="/documents/:id/renditions" element={<DocumentRenditionsPage />} />;
<Route path="/documents/trash" element={<TrashBinPage />} />;
<Route path="/documents/quota" element={<StorageQuotaPage />} />;
```

## Injection

- **API client** — the headless components resolve the Axios client from a
  `GranitClientProvider` higher in the tree (via `useDocumentsConfig`). No client
  is baked in.
- **Permissions** — `usePermissions` from `@granit/react-authorization` gates the
  manage / transfer-ownership / share actions
  (`DocumentsPermissions.*`, `TAXONOMY_PERMISSIONS.*`).
- **Routing** — `react-router-dom` (`Link` / `useParams` / `useNavigate`) for the
  explorer-to-detail navigation and the document sub-pages.
- **i18n** — ships its flat `documents:*` admin strings
  (`documentsAdminTranslationsEn/Fr`); the host registers them. (Distinct from the
  headless `documentsTranslations*` nested label bundle.)
