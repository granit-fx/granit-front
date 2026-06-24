# @granit/react-ui-presence

Admin UI for the Granit **Presence** module — a single live-demo page that wires
the headless presence hooks into a rendered surface: your own presence, a
manual-status picker, a Do-Not-Disturb banner, a team batch lookup and a
resource-room view.

This is the **react-ui admin feature kit** layer: it holds rendering only and
composes the headless [`@granit/react-presence`](../react-presence)
(`useMyPresence`, `useBatchPresence`, `useResourcePresence`,
`useClearMyPresenceOverride`, `PresenceDot`, `PresencePicker`, `DndBanner`) and
[`@granit/react-identity`](../react-identity) (`useProviderUsers`) with the
foundation UI primitives from [`@granit/react-ui`](../react-ui). The split is
three packages over the same .NET `Granit.Presence` backend
(contract: `contracts/openapi/presence.json`):

- [`@granit/presence`](../presence) — framework-agnostic core: presence DTOs +
  Axios functions (mirror of `Granit.Presence`).
- [`@granit/react-presence`](../react-presence) — React Query hooks, provider,
  and headless components (`PresenceProvider`, `PresenceDot`, `PresencePicker`,
  `DndBanner`, `PresenceHeartbeat`).
- `@granit/react-ui-presence` (this package) — the assembled demo page plus its
  `Presence.*` i18n bundles.

The Axios client is never baked in: the hooks behind `PresenceDemoPage` resolve
it from the `PresenceProvider` / `IdentityProvider` mounted higher in the host
tree (each fed a `GranitClientProvider` client).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-presence` — headless hooks and components this page composes;
  also supplies the `PresenceProvider` the host must mount.
- `@granit/react-identity` — `useProviderUsers` for the team batch lookup; also
  supplies the `IdentityProvider` the host must mount.
- `@granit/presence` — core `PRESENCE_DEFAULTS` (offline threshold) surfaced in
  the "your presence" card.
- `@granit/identity` — the `IdentityUser` shape used for team display names.
- `@granit/react-ui` — foundation primitives (`Card`, `CardHeader`, …) and the
  `TooltipProvider`.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter` for the
  page's strings and `lastSeenUtc` formatting.
- `@granit/types` — shared base types (`UserId`).
- `react` and `react-dom` (`^19`).

## Quick start

Mount the headless `PresenceProvider` and `IdentityProvider` once (they resolve
the Axios client, base paths, and query keys), register the bundled strings, then
render the page anywhere below them.

```tsx
import { createApiClient } from '@granit/api-client';
import { GranitClientProvider } from '@granit/react-api-client';
import { IdentityProvider } from '@granit/react-identity';
import { PresenceProvider } from '@granit/react-presence';
import { TooltipProvider } from '@granit/react-ui';
import { PresenceDemoPage, presenceTranslationsEn } from '@granit/react-ui-presence';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Register the page's flat Presence.* keys into the host i18next instance.
i18n.addResourceBundle('en', 'translation', presenceTranslationsEn, true, true);

const client = createApiClient({ baseURL: '/api' });
const queryClient = new QueryClient();

function PresenceRoute() {
  return (
    <QueryClientProvider client={queryClient}>
      <GranitClientProvider client={client}>
        <IdentityProvider config={{ client, providerBasePath: '/api/v1/identity/provider' }}>
          <PresenceProvider config={{ client, basePath: '/api/v1' }}>
            <TooltipProvider>
              <PresenceDemoPage />
            </TooltipProvider>
          </PresenceProvider>
        </IdentityProvider>
      </GranitClientProvider>
    </QueryClientProvider>
  );
}
```

`PresenceDemoPage` takes no props. It reads `useMyPresence` for the current
user's effective status / manual override / `lastSeenUtc`, lists up to four
teammates from `useProviderUsers` resolved through `useBatchPresence`, and shows a
fixed demo resource room (`showcase.demo` / `room-1`) via `useResourcePresence`.
With no live backend each card renders its loading / empty / error state.

## Public API

| Symbol                   | Kind      | Purpose                                                                                       |
| ------------------------ | --------- | --------------------------------------------------------------------------------------------- |
| `PresenceDemoPage`       | component | Propless demo page: own presence, status picker, DnD banner, team batch lookup, resource room |
| `presenceTranslationsEn` | const     | English `Presence.*` i18next bundle (flat keys, `translation` ns)                             |
| `presenceTranslationsFr` | const     | French `Presence.*` i18next bundle (same key set)                                             |
| `PresenceTranslations`   | type      | Shape of the bundle (`typeof presenceTranslationsEn`)                                         |

The bundles use flat keys with no namespace/key separators (`Presence.Title`,
`Presence.RoomLastSeen`, …) and `{{interpolation}}` placeholders; register them
with `i18n.addResourceBundle(lng, 'translation', bundle, true, true)`.

## Out of scope / caveats

- **Showcase demo, not a production widget.** The page hard-codes a single demo
  room (`showcase.demo` / `room-1`) and a four-teammate cap; it is a guided tour
  of `@granit/react-presence`, not a reusable presence panel. Build production
  surfaces directly on the headless hooks.
- **Headless logic and transport live one layer down.** Heartbeat cadence,
  status mutations, batch fetching, and the room join lifecycle are owned by
  [`@granit/react-presence`](../react-presence); DTOs and Axios calls by
  [`@granit/presence`](../presence). This package only renders them.
- **Providers are the host's job.** No `PresenceProvider` / `IdentityProvider` is
  mounted here — without them the hooks cannot resolve a client and every card
  stays in its loading state.
- **i18n registration is the host's job.** The package ships its `Presence.*`
  strings but does not register them; the host calls `addResourceBundle`. The
  `Common.*` keys referenced by foundation components are app-global.

## License

Apache-2.0
