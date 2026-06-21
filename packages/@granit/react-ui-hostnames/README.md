# @granit/react-ui-hostnames

Admin UI for the managed **Hostnames** module — an owner-scoped hostname list
(status / certificate badges, DNS details, last-check, row actions) and the
add-hostname dialog (availability check, primary flag).

The **visual** layer for hostnames: it composes the headless
[`@granit/react-hostnames`](../react-hostnames) (provider + hooks) with the
foundation UI packages ([`@granit/react-ui`](../react-ui)) and gates management
actions with [`@granit/react-authorization`](../react-authorization)
`usePermissions`.

## Usage

```tsx
import { HostnamesPage, hostnamesTranslationsEn } from '@granit/react-ui-hostnames';

i18n.addResourceBundle('en', 'translation', hostnamesTranslationsEn, true, true);

// Mount under a HostnamesProvider (from @granit/react-hostnames):
<Route path="/hostnames" element={<HostnamesPage />} />;
```

## Injection

- **API client** — resolved from a `GranitClientProvider` / `HostnamesProvider`
  higher in the tree (via the `@granit/react-hostnames` hooks). No client baked in.
- **Permissions** — `usePermissions` from `@granit/react-authorization` gates the
  add / set-primary / verify / delete actions (`Hostnames.Hostnames.Manage`).
- **i18n** — ships its `Hostnames.*` strings (`hostnamesTranslationsEn/Fr`); the
  host registers them.
