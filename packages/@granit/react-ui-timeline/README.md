# @granit/react-ui-timeline

Admin UI for the Granit Timeline module — the entity activity feed: a paginated
stream of timeline entries, a composer with @-mention autocomplete and emoji
reactions. The UI counterpart to the headless
[`@granit/react-timeline`](../react-timeline) (provider + hooks).

## Components

- **`EntityTimeline`** — the page-level feed for one entity (`entityType` +
  `entityId`): composer on top, paginated stream below.
- `TimelineStream`, `TimelineEntry`, `TimelineComposer`, `ReactionStrip`,
  `MentionEditor`, `EmojiPicker`, `TwemojiImage` — the building blocks.

## App-agnostic by design

`EntityTimeline` stays neutral so stories/tests can mount it without the auth,
identity or query stacks. Hosts inject from their own context at the call site:

- `currentUserId` — `useAuth().user?.sub` (drives author-only edit gating);
- `canReact` — `usePermissions().hasPermission('Timeline.Reactions.React')`;
- `searchMentions` — a `(query) => Promise<MentionSuggestion[]>` over the host's
  identity client.

The `TimelineProvider` (from `@granit/react-timeline`, wired with the host's API
client) is mounted by the app, not this package. The `Timeline.*` strings ship
in `timelineAdminTranslationsEn` / `timelineAdminTranslationsFr`.
