# @granit/react-ui-ai

Admin UI for the **AI** module — the workspace management surface (list / grid
with a view switcher, create and edit forms with provider/model selection,
capabilities badges, a delete confirmation and an inline chat/embeddings test
panel) plus the query-driven **AI usage tracking** grid.

The **visual** layer for AI administration: it composes the headless
[`@granit/react-ai`](../react-ai) (provider + hooks, plus the opt-in
`@granit/react-ai/usage` querying surface) with the foundation UI packages
([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit)) and gates management
actions with [`@granit/react-authorization`](../react-authorization)
`usePermissions`.

## Usage

```tsx
import { AIWorkspaceListPage, aiTranslationsEn } from '@granit/react-ui-ai';

i18n.addResourceBundle('en', 'translation', aiTranslationsEn, true, true);

// Mount under a GranitClientProvider + AIProvider (from @granit/react-ai):
<Route path="/ai/workspaces" element={<AIWorkspaceListPage />} />;
<Route path="/ai/workspaces/new" element={<AIWorkspaceCreatePage />} />;
<Route path="/ai/workspaces/:name" element={<AIWorkspaceEditPage />} />;
<Route path="/ai/usage" element={<AIUsagePage />} />;
```

## Injection

- **API client** — the headless `AIProvider` (and `AIUsageProvider`, which the
  usage page wraps internally) resolves the Axios client from a
  `GranitClientProvider` higher in the tree (via `@granit/react-api-client`). No
  client is baked in.
- **Permissions** — `usePermissions` from `@granit/react-authorization` gates the
  create / edit / delete actions and the test panel
  (`AIPermissions.Workspaces.Manage`, `.Chat.Execute`, `.Embeddings.Execute`).
- **Routing** — `react-router-dom` (`Link` / `useNavigate` / `useParams`) for the
  list-to-detail navigation and the back links.
- **i18n** — ships its `AI.*` strings (`aiTranslationsEn/Fr`); the host registers
  them. Host-owned `Common.*` / `Validation.*` keys are expected from the app.
