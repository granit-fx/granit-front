# @granit/react-ui-settings

Admin UI for the **Granit.Settings** module — the application-settings edit page
and the dynamic settings panel (typed fields per `ValueKind`, allowed-value
dropdowns, encrypted-secret masking, bulk save with per-row outcomes).

The **visual** layer for settings: it composes the headless
[`@granit/react-settings`](../react-settings) (provider + hooks) with the
foundation UI packages ([`@granit/react-ui`](../react-ui)).

## Usage

```tsx
import { AppSettingsEditPage, settingsTranslationsEn } from '@granit/react-ui-settings';

i18n.addResourceBundle('en', 'translation', settingsTranslationsEn, true, true);

// Host app:   <Route path="/settings/config" element={<AppSettingsEditPage scope="global" />} />
// Tenant app: <Route path="/settings/config" element={<AppSettingsEditPage scope="tenant" />} />
```

## Injection

- **API client** — resolved from a `GranitClientProvider`
  (`@granit/react-api-client`) higher in the tree (via the `@granit/react-settings`
  hooks). No client is baked in.
- **Scope** — `scope` (`'global'` | `'tenant'`, default `'global'`) is injected,
  so the package never depends on an app's host/tenant flag.
- **i18n** — ships its `Config.AppSettings.*` strings
  (`settingsTranslationsEn/Fr`); the host registers them. `Common.*` and dynamic
  `Setting:*` keys are app/backend-provided.
