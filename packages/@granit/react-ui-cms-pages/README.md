# @granit/react-ui-cms-pages

Admin UI for the **CMS Pages** module — the page-structure tree (slug + parent +
depth, with delete confirmation) and the create/rename page form. The form is
**spec-driven**: its validation rules are derived from the OpenAPI contract
(`cmsConstraints.CreatePageRequest`) via `createConstraintsResolver`, and an
"Edit content" link-out delegates block authoring to the CMS renderer.

The **visual** layer for CMS pages: it composes the headless
[`@granit/react-cms`](../react-cms) (admin hooks + `CmsProvider`) with the
foundation UI packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-validation`](../react-validation)).

## Usage

```tsx
import {
  PageTreePage,
  PageFormPage,
  cmsPagesTranslationsEn,
} from '@granit/react-ui-cms-pages';

i18n.addResourceBundle('en', 'translation', cmsPagesTranslationsEn, true, true);

<Route path="/cms/sites/:id/pages" element={<PageTreePage />} />
<Route path="/cms/sites/:id/pages/new" element={<PageFormPage />} />
<Route path="/cms/sites/:id/pages/:pageId/edit" element={<PageFormPage />} />;
```

Wrap the routes in a `CmsProvider` (from `@granit/react-cms`) — these pages do
**not** provide one; they read the headless config + Axios client from the host
tree.

## Injection

- **API client** — resolved by the host-provided `CmsProvider`
  (`@granit/react-cms`), which itself falls back to a `GranitClientProvider`.
  No client is baked in.
- **Validation** — `createConstraintsResolver(cmsConstraints.CreatePageRequest)`
  (`@granit/react-validation` + `@granit/cms`). `Validation:Builtin:*` messages
  are owned by the host's `@granit/Validation` i18n bundle.
- **i18n** — ships its `cms:Pages.*` strings (`cmsPagesTranslationsEn/Fr`); the
  host registers them. The `cms:` prefix is a **literal** flat-key part, not an
  i18next namespace. `cms:Common.*` keys are app-global.
- **Content editor** — `buildPageEditorUrl` builds a link-out to the
  granit-cms-renderer Puck editor, gated by `VITE_CMS_RENDERER_URL` (read from
  the host's Vite environment; disabled when unset).
