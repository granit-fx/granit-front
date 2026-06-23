# @granit/react-ui-entities-customization

Admin UI for **entity layout customization** (Layer 1 admin overrides) — an
entity / workspace form-layout editor (reorder, regroup and hide fields) with a
field-resolution inspector, plus a saved-views manager (create / edit / pin /
set tenant & personal defaults / delete).

The **visual** layer for entity customization: it composes the headless
[`@granit/react-entities-customization`](../react-entities-customization)
(provider + hooks + editors),
[`@granit/react-entities`](../react-entities),
[`@granit/react-entities-views`](../react-entities-views) and
[`@granit/react-workspaces`](../react-workspaces) with the foundation UI package
[`@granit/react-ui`](../react-ui) and gates the page with
[`@granit/react-authorization`](../react-authorization) `usePermissions`.

## Usage

```tsx
import {
  CustomizationPage,
  entitiesCustomizationAdminTranslationsEn,
} from '@granit/react-ui-entities-customization';

i18n.addResourceBundle('en', 'translation', entitiesCustomizationAdminTranslationsEn, true, true);

// Mount under a GranitClientProvider + CustomizationProvider:
<Route path="/settings/customization" element={<CustomizationPage />} />;
```

## Injection

- **API client** — the host wraps a `CustomizationProvider` which resolves the
  Axios client from a `GranitClientProvider` higher in the tree (via
  `@granit/react-api-client`). The views / workspaces hooks resolve the same
  client. No client is baked in.
- **Permissions** — `usePermissions` from `@granit/react-authorization` gates the
  page (`EntitiesCustomization.Forms.Manage` for the Layouts tab,
  `Entities.Views.Manage` for the Views tab).
- **i18n** — ships its `customization:*` and `views:*` strings
  (`entitiesCustomizationAdminTranslationsEn/Fr`); the host registers them. The
  `customization:` / `views:` prefix is a literal part of each flat key, not an
  i18next namespace.
