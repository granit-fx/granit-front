# @granit/react-ui-templating

Admin UI for the **Templating** module — the Scriban template list (a
query-driven grid with status badges, smart filters, data-exchange import /
export and a stats dashboard) plus the create / edit workspace (zod-validated
metadata form, a dual WYSIWYG / code editor with variable & filter insertion,
live HTML / PDF / Excel preview with reusable test-data sets, lifecycle
publish / unpublish, revision history and a side-by-side diff) and the category
manager.

The **visual** layer for templating: it composes the headless
[`@granit/react-templating`](../react-templating) (provider + hooks) with the
foundation UI packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit)) and the data-exchange UI
([`@granit/react-ui-data-exchange`](../react-ui-data-exchange)).

## Usage

```tsx
import { TemplateListPage, templatesTranslationsEn } from '@granit/react-ui-templating';

i18n.addResourceBundle('en', 'translation', templatesTranslationsEn, true, true);

// Mount under a GranitClientProvider (the pages wrap their own TemplatingProvider):
<Route path="/templating/templates" element={<TemplateListPage />} />;
<Route path="/templating/templates/new" element={<TemplateCreatePage />} />;
<Route path="/templating/templates/:name" element={<TemplateEditPage />} />;
```

## Injection

- **API client** — the pages wrap a `TemplatingProvider config={TEMPLATING_CONFIG}`
  (no `client` baked in) which resolves the Axios client from a
  `GranitClientProvider` higher in the tree (via `@granit/react-api-client`).
- **Editors** — the WYSIWYG editor is [TipTap](https://tiptap.dev) and the code
  editor is [CodeMirror 6](https://codemirror.net) (`text/html` & `text/plain`),
  both lazy-loaded. `next-themes` drives the CodeMirror dark theme.
- **Routing** — `react-router-dom` (`Link` / `useParams` / `useNavigate`) for the
  list / create / edit navigation and the back links.
- **i18n** — ships its `Templates.*` strings (`templatesTranslationsEn/Fr`); the
  host registers them. Host-owned `Common.*` / `DataExchange.*` keys come from the
  app bundle.
