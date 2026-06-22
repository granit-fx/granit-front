# @granit/react-ui-cms-menus

Admin UI for **CMS site menus** — a site-scoped menu list (key, title, item count,
delete confirmation) and a create / edit form (key, title and a raw JSON editor for
menu items).

The **visual** layer for CMS menus: it composes the headless
[`@granit/react-cms`](../react-cms) (provider + hooks) with the foundation UI
packages ([`@granit/react-ui`](../react-ui)). The create / edit form derives its
validation from the OpenAPI contract via
[`@granit/react-validation`](../react-validation) `createConstraintsResolver`
over [`@granit/cms`](../cms) `cmsConstraints`.

## Usage

```tsx
import { MenusListPage, MenuFormPage, cmsMenusTranslationsEn } from '@granit/react-ui-cms-menus';

i18n.addResourceBundle('en', 'translation', cmsMenusTranslationsEn, true, true);

// Mount under a CmsProvider (from @granit/react-cms):
<Route path="/cms/sites/:id/menus" element={<MenusListPage />} />
<Route path="/cms/sites/:id/menus/new" element={<MenuFormPage />} />
<Route path="/cms/sites/:id/menus/:menuId/edit" element={<MenuFormPage />} />;
```

## Injection

- **API client** — resolved from a `GranitClientProvider` / `CmsProvider` higher in
  the tree (via the `@granit/react-cms` hooks). No client baked in.
- **Validation** — the form's `key` / `title` constraints come from
  `cmsConstraints.Menu{Create,Update}Request` (OpenAPI-extracted); the `items` JSON
  textarea is validated by an inline parse. `Validation:Builtin:*` messages are owned
  by the backend `Granit.Validation` package (loaded by the host app).
- **i18n** — ships its `cms:Menus.*` strings (`cmsMenusTranslationsEn/Fr`); the host
  registers them. The shared `cms:Common.*` / `cms:Sites.Title` strings the pages
  reference are owned by the host bundle.
