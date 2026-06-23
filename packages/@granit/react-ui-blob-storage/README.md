# @granit/react-ui-blob-storage

Admin UI for the **Blob Storage** module — a query-driven blobs list (status
pills, human-readable size, created-at, per-row download / delete) plus the
orphan-cleanup confirmation and the crypto-shred delete dialog.

The **visual** layer for blob storage: it composes the headless
[`@granit/react-blob-storage`](../react-blob-storage) (provider + hooks) with the
foundation UI packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit)) and gates management
actions with [`@granit/react-authorization`](../react-authorization)
`usePermissions`.

## Usage

```tsx
import { BlobListPage, blobStorageTranslationsEn } from '@granit/react-ui-blob-storage';

i18n.addResourceBundle('en', 'translation', blobStorageTranslationsEn, true, true);

// Mount under a BlobStorageProvider (from @granit/react-blob-storage):
<Route path="/blob-storage" element={<BlobListPage />} />;
```

## Injection

- **API client** — resolved from a `GranitClientProvider` / `BlobStorageProvider`
  higher in the tree (via the `@granit/react-blob-storage` hooks). No client baked in.
- **Permissions** — `usePermissions` from `@granit/react-authorization` gates the
  download / delete / cleanup actions (`BlobStorage.Administration.Manage`).
- **i18n** — ships its `BlobStorage.*` strings (`blobStorageTranslationsEn/Fr`);
  the host registers them.
