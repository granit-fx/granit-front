# @granit/react-ui-taxonomy

Admin UI for the **Taxonomy** module — the per-scope **tag manager** and
**category tree** admin pages plus a header-mounted **cross-entity search bar**
that navigates to the matching entity-detail route on selection.

The **visual** layer for taxonomy: it composes the headless
[`@granit/react-taxonomy`](../react-taxonomy) (provider + `CategoryTree` /
`TagManager` / `TaxonomySearchBar` components) with localised `labels` props and
gates management actions with [`@granit/react-authorization`](../react-authorization)
`usePermissions`.

## Usage

```tsx
import { TagManagerPage, taxonomyAdminTranslationsEn } from '@granit/react-ui-taxonomy';

i18n.addResourceBundle('en', 'translation', taxonomyAdminTranslationsEn, true, true);

// Mount under a GranitClientProvider + TaxonomyProvider:
<Route path="/taxonomy/tags" element={<TagManagerPage />} />;
<Route path="/taxonomy/categories" element={<CategoryTreePage />} />;
```

## Injection

- **API client** — the headless `@granit/react-taxonomy` components resolve the
  Axios client from a `TaxonomyProvider` higher in the tree (which itself reads a
  `GranitClientProvider`). No client is baked in.
- **Permissions** — `usePermissions` from `@granit/react-authorization` gates the
  tag / category management actions (`TaxonomyPermissions.Tags.Manage` /
  `TaxonomyPermissions.Categories.Manage`).
- **Routing** — `react-router-dom` (`useNavigate`) drives the header search bar's
  navigation to entity-detail routes (Documents / Parties).
- **i18n** — ships its `taxonomy:*` strings as a flat bundle
  (`taxonomyAdminTranslationsEn/Fr`, named to avoid colliding with the headless
  package's nested `taxonomyTranslationsEn/Fr`); the host registers them.

## Scope

The Taxonomy module is per-scope (one set of tags + one category tree per
module). These pages surface a single illustrative scope
(`TAXONOMY_DEFAULT_SCOPE`); real tenants wire one page per module they own.
