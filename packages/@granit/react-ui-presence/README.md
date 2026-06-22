# @granit/react-ui-presence

Admin UI for the **Presence** module — a live demo page wiring the headless
presence hooks: your own presence, a manual-status picker, a Do-Not-Disturb
banner, a team batch lookup and a resource-room view.

The **visual** layer for presence: it composes the headless
[`@granit/react-presence`](../react-presence) (`useMyPresence`,
`useBatchPresence`, `useResourcePresence`, …) and
[`@granit/react-identity`](../react-identity) (`useProviderUsers`) with the
foundation UI packages ([`@granit/react-ui`](../react-ui)).

## Usage

```tsx
import { PresenceDemoPage, presenceTranslationsEn } from '@granit/react-ui-presence';

i18n.addResourceBundle('en', 'translation', presenceTranslationsEn, true, true);

<Route path="/presence" element={<PresenceDemoPage />} />;
```

## Injection

- **API client** — the page relies on the headless hooks, which resolve their
  Axios client from the `PresenceProvider` / `IdentityProvider` (each fed a
  `GranitClientProvider` client) higher in the host tree. No client is baked in.
- **i18n** — ships its `Presence.*` strings (`presenceTranslationsEn/Fr`); the
  host registers them. `Common.*` keys are app-global.
