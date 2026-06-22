# @granit/react-ui-diagnostics

Admin UI for the **Diagnostics** module — the monitoring page (a grid of
service-health cards with an auto-refresh indicator).

The **visual** layer for diagnostics: it composes the headless
[`@granit/react-diagnostics`](../react-diagnostics) (`useMonitoringHealth`) with
the foundation UI packages ([`@granit/react-ui`](../react-ui)).

## Usage

```tsx
import { DiagnosticListPage, diagnosticsTranslationsEn } from '@granit/react-ui-diagnostics';

i18n.addResourceBundle('en', 'translation', diagnosticsTranslationsEn, true, true);

<Route path="/diagnostics" element={<DiagnosticListPage />} />;
```

## Injection

- **API client** — resolved from a `GranitClientProvider`
  (`@granit/react-api-client`) higher in the tree (`useGranitClient`). No client
  is baked in.
- **i18n** — ships its `Diagnostics.*` strings (`diagnosticsTranslationsEn/Fr`);
  the host registers them. `Common.*` keys are app-global.
