# @granit/react-ui-timeline

Admin UI kit for the Granit **timeline** module — the per-entity activity feed:
a paginated, threaded stream of entries, a TipTap composer with `@`-mention
autocomplete, and emoji reactions backed by an emoji-mart picker with Twemoji
glyphs. This is the **react-ui admin feature kit**: it composes the headless
provider + hooks from [`@granit/react-timeline`](../react-timeline) with the
foundation UI primitives from `@granit/react-ui` into ready-to-mount, styled
components.

The split is three packages over the same .NET `Granit.Timeline` backend
(contract: `contracts/openapi/timeline.json`):

- [`@granit/timeline`](../timeline) — framework-agnostic core: DTOs + Axios
  functions, the reaction-emoji parsers, and `TimelinePermissions`.
- [`@granit/react-timeline`](../react-timeline) — React Query hooks, the
  `TimelineProvider`, the headless `ReactionBar`, and the `timeline` i18n bundles.
- `@granit/react-ui-timeline` (this package) — the styled stream, entry rows, the
  `@`-mention composer, the emoji-mart picker, and the Twemoji renderer.

`EntityTimeline` is **app-agnostic by design**: auth, identity, permission, and
mention-lookup data are injected as props at the call site, so stories and tests
can mount it without the auth / identity / query stacks. The host mounts the
`TimelineProvider` (wired with its own Axios client); this package never owns it.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-timeline` — the headless provider + hooks this kit composes
  (`useTimeline`, `useTimelineActions`, `useToggleReaction`, …).
- `@granit/timeline` — core DTOs, enums, and reaction-emoji parsers.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors); `isAxiosError` is used to classify edit rejections.
- `@granit/react-ui` — foundation primitives (`Card`, `Dialog`, `Button`,
  `Popover`, `Avatar`, `Spinner`, `toast`).
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/types`, `@granit/utils` — shared base types and the `cn` helper.
- `@tanstack/react-query` (`^5`), `react` / `react-dom` (`^19`).
- `react-router` (`^8`) — same-origin mention/URL links route in-app.
- `@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/extension-mention` +
  `@tiptap/extension-placeholder` (`^3`) and `tippy.js` (`^6`) — the mention
  composer surface and its caret-anchored suggestion popup.
- `@emoji-mart/react` + `@emoji-mart/data` (`^1`) — the lazy-loaded emoji picker
  (Twitter set, code-split on first open).
- `lucide-react` (`^1`) — icons; `next-themes` (`^0.4`) — picker light/dark sync.

## Quick start

The host mounts `<TimelineProvider>` (from `@granit/react-timeline`) once, then
drops `<EntityTimeline>` for any `(entityType, entityId)` pair, injecting the
host-owned auth / identity bits as props.

```tsx
import { TimelineProvider } from '@granit/react-timeline';
import { EntityTimeline } from '@granit/react-ui-timeline';
import { useGranitClient } from '@granit/react-api-client';
import { useAuth, usePermissions } from '@granit/react-authorization';
import { searchUserMentions } from '@app/identity';

function App({ children }: { children: React.ReactNode }) {
  return <TimelineProvider config={{ client: useGranitClient() }}>{children}</TimelineProvider>;
}

function PartyTimeline({ partyId }: { partyId: string }) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  return (
    <EntityTimeline
      entityType="Party"
      entityId={partyId}
      currentUserId={user?.sub} // drives author-only edit gating; undefined disables edit
      canReact={hasPermission('Timeline.Reactions.React')} // UX hint; backend re-checks
      searchMentions={searchUserMentions} // (query) => Promise<MentionSuggestion[]>
    />
  );
}
```

Register the flat `Timeline.*` strings on mount (the host installs them with key
separators disabled, so the dotted keys resolve verbatim):

```ts
import {
  timelineAdminTranslationsEn,
  timelineAdminTranslationsFr,
} from '@granit/react-ui-timeline';

i18n.addResourceBundle('en', 'translation', timelineAdminTranslationsEn, true, true);
i18n.addResourceBundle('fr', 'translation', timelineAdminTranslationsFr, true, true);
```

The building blocks are exported individually for custom layouts —
`<TimelineStream>` (threaded list with load-more), `<TimelineEntry>` (avatar,
body, reactions, reply/edit/delete actions), `<TimelineComposer>` (entry-type
selector, mention editor, submit), and `<ReactionStrip>` (chips with picker
trigger). They compose the same way `EntityTimeline` wires them.

## Public API

| Symbol                        | Kind      | Purpose                                                                        |
| ----------------------------- | --------- | ------------------------------------------------------------------------------ |
| `EntityTimeline`              | component | Page-level feed for one entity: composer dialog + threaded stream              |
| `EntityTimelineProps`         | type      | `entityType`/`entityId` + injected `currentUserId`/`canReact`/`searchMentions` |
| `TimelineStream`              | component | Threaded entry list with depth indentation + load-more button                  |
| `TimelineStreamProps`         | type      | Entries, entity context, `canEdit` predicate, `renderEntry`/`renderBody`       |
| `TimelineEntry`               | component | One row: avatar, author/time, body, reaction bar, reply/edit/delete            |
| `TimelineEntryProps`          | type      | Entry DTO + `canReact`, `depth`, action callbacks, `renderBody`                |
| `TimelineComposer`            | component | Entry-type selector + mention editor + submit; used for create and edit        |
| `TimelineComposerProps`       | type      | `onSubmit`, `entryTypes`, `initialBody`/`initialEntryType`, `searchMentions`   |
| `ReactionStrip`               | component | Reaction chips; read-only without `onToggle`, else opens the picker            |
| `ReactionStripProps`          | type      | `entryId`, `reactions` map, optional `onToggle`                                |
| `MentionEditor`               | component | TipTap surface; mentions are atomic chips; `@[Name](user:guid)` markdown       |
| `MentionEditorProps`          | type      | `initialBody`, `onChange`, `searchMentions`, `onSubmit`                        |
| `EmojiPicker`                 | component | Lazy emoji-mart picker (Twitter set, theme-synced, i18n category names)        |
| `EmojiPickerProps`            | type      | `onSelect(native)` + optional `onClose`                                        |
| `TwemojiImage`                | component | Render an emoji as a Twemoji SVG from the jsdelivr CDN, with glyph fallback    |
| `TwemojiImageProps`           | type      | `emoji`, `size`, `className`, `style`                                          |
| `emojiToTwemojiCodepoints`    | fn        | Map an emoji grapheme to its hyphenated Twemoji codepoint filename             |
| `timelineAdminTranslationsEn` | const     | Flat `Timeline.*` English strings for this UI kit                              |
| `timelineAdminTranslationsFr` | const     | Flat `Timeline.*` French strings for this UI kit                               |

`EntityTimeline` requires a `<TimelineProvider>` ancestor and reads/writes the
stream via the `@granit/react-timeline` hooks. The composer emits the canonical
`@[Display Name](user:<guid>)` markdown that the backend's `MentionParser`
consumes; the default body renderer parses it back into `<Link>` mention chips.

## Caveats

- **App-agnostic injection.** `EntityTimeline` stays neutral so it mounts without
  the auth / identity stacks. Hosts pass `currentUserId` (from `useAuth().user.sub`),
  `canReact` (`usePermissions().hasPermission('Timeline.Reactions.React')`), and
  `searchMentions` at the call site. `currentUserId === undefined` disables editing;
  `canReact === false` renders read-only reaction strips; omitting `searchMentions`
  disables `@`-mention autocomplete.
- **Client-side permission checks are a UX hint, not a boundary.** `canReact` and
  the author-only edit gates only hide controls; the .NET backend re-checks every
  mutation. The PATCH edit endpoint rejects with an RFC 7807 `403`
  (`timeline-entry-not-editable`) carrying a machine-readable `reason` (external
  origin, system log, not author, window expired), surfaced as a localised toast.
- **Twemoji CDN — CSP `img-src`.** `TwemojiImage` fetches SVGs from
  `https://cdn.jsdelivr.net` via a plain `<img>`. The app **must** allow
  `img-src https://cdn.jsdelivr.net`; no `connect-src` is needed (`<img>` doesn't
  use fetch). Missing assets (notably VS-16-stripped ZWJ sequences) fall back to
  native glyph rendering, so users never see a broken-image icon.
- **Reverse-tabnabbing.** The default body renderer keeps same-origin links in-app
  via React Router; cross-origin links open in a new tab with
  `rel="noopener noreferrer"`. Override the whole renderer via the `renderBody`
  prop for tenant-scoped routing or richer markdown.
- **i18n keys are flat `Timeline.*` in the `translation` namespace.** Register the
  bundles with key separators disabled so the dotted keys resolve verbatim. The
  `timelineAdmin*` export prefix avoids colliding with the headless
  `@granit/react-timeline` `timelineTranslations*` exports.
- **Reactions stay QueryClient-free until needed.** A read-only `<ReactionStrip>`
  (no `onToggle`, or `canReact === false`) mounts without a `QueryClientProvider`;
  the interactive reaction bar is mounted conditionally so stories and unit tests
  can render entries without the React Query / auth wiring.

## Out of scope

- **HTTP transport, DTOs, hooks, and the provider** — owned by
  [`@granit/timeline`](../timeline) and [`@granit/react-timeline`](../react-timeline).
  This kit only renders what those layers fetch and mutate.
- **Authorization enforcement** — the .NET `Granit.Timeline` backend is the
  authoritative check on every read and mutation.
- **Mention data source** — `searchMentions` is host-supplied; this package does
  not query any identity / lookup endpoint itself.

## License

Apache-2.0
