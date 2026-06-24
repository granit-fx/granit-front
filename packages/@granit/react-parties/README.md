# @granit/react-parties

React hooks, provider and headless components for the Granit **parties** module
(Tiers / business partners) — CRUD + lifecycle, sub-collections (addresses,
emails, phones, external mappings, roles), tax status, free-form metadata, plus
the **merge** and **duplicate-detection** flows. This is the **React hooks
layer**: it wraps the framework-agnostic Axios calls and DTOs from
[`@granit/parties`](../parties) in TanStack Query hooks behind a shared
`PartiesProvider`, and ships a handful of unstyled, BYO-modal components
(`MergeWizard`, `DuplicatesInbox`, `PartyDuplicatesBadge`).

The split is three packages over the same .NET `Granit.Parties` backend
(contract: `contracts/openapi/parties.json`):

- [`@granit/parties`](../parties) — framework-agnostic core: DTOs + Axios
  functions (`listParties`, `createParty`, `mergeParty`, …).
- `@granit/react-parties` (this package) — React Query hooks + provider +
  headless components.
- [`@granit/react-ui-parties`](../react-ui-parties) — admin UI kit: the party
  list (role/status filters), the conflict-resolving create dialog, the tabbed
  detail view, lifecycle actions, taxonomy tags, and the duplicates inbox —
  fully styled on the foundation UI packages.

The merge surface composes the aggregate-agnostic engine in
[`@granit/entity-merge`](../entity-merge) /
[`@granit/react-entity-merge`](../react-entity-merge): `MergeWizard` reuses
`FieldConflictTable`, `ReferenceRewriterSummary` and `useFieldChoices`, and the
merge mutations reuse `generateMergeIdempotencyKey` for retry-safe submits.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/parties` — core DTOs + Axios calls this layer wraps.
- `@granit/entity-merge` — `generateMergeIdempotencyKey` for merge submits.
- `@granit/react-entity-merge` — conflict UI primitives composed by `MergeWizard`.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@granit/logger` — `createLogger`, used for mutation success diagnostics.
- `@granit/types` — shared base / branded id types.
- `@tanstack/react-query` (`^5`), `react` (`^19`), `react-i18next` (`^17`) for the
  in-package components.
- `@granit/query-engine` + `@granit/react-query-engine` (**optional**) — only the
  `DuplicatesInbox` paginated grid needs them.
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-parties/testing` subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it. Register the i18n
bundles under the `parties` namespace so the components have copy.

```tsx
import {
  PartiesProvider,
  usePartiesQuery,
  useCreatePartyMutation,
  partiesTranslationsEn,
} from '@granit/react-parties';
import { useGranitClient } from '@granit/react-api-client';
import i18n from 'i18next';

i18n.addResourceBundle('en', 'parties', partiesTranslationsEn);

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <PartiesProvider config={{ client: useGranitClient() }}>
      {children}
    </PartiesProvider>
  );
}

function CustomerList() {
  const { data: customers } = usePartiesQuery({ role: 'Customer' });
  const create = useCreatePartyMutation();

  return (
    <ul>
      {customers?.map((p) => <li key={p.id}>{p.name}</li>)}
      <button
        type="button"
        onClick={() => create.mutate({ request: { name: 'Acme', kind: 'Company' } })}
      >
        New customer
      </button>
    </ul>
  );
}
```

Mutations invalidate the relevant `list` / `detail` query keys on success
(`buildPartiesQueryKey` honours the provider's `queryKeyPrefix`). A Tier-1
deterministic-duplicate collision on create returns `409` with a
`PartyCreateConflictResponse` body in `error.response.data` — render your
"potential duplicates" dialog from it (use existing / create anyway / merge).

The two-party merge wizard composes the entity-merge primitives; it is unstyled
beyond minimal Tailwind utilities, so wrap it in your own dialog and gate it on
the caller's permission check:

```tsx
import { MergeWizard } from '@granit/react-parties';
import type { PartyId } from '@granit/parties';

function MergeDialog({ survivorId, loserId }: { survivorId: PartyId; loserId: PartyId }) {
  const [open, setOpen] = useState(true);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <MergeWizard
        survivorId={survivorId}
        loserId={loserId}
        onCancel={() => setOpen(false)}
        onSuccess={() => setOpen(false)}
      />
    </Dialog>
  );
}
```

## Public API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `PartiesProvider` | provider | Supplies client, base path, query-key prefix to all hooks below it |
| `usePartiesConfig` | hook | Read the resolved config; throws outside a provider |
| `buildPartiesQueryKey` | fn | Query-key factory honouring the configured `queryKeyPrefix` |
| `usePartiesQuery` | hook | `GET {basePath}` — list parties, optional `{ role }` filter |
| `usePartyQuery` | hook | `GET {basePath}/{id}` — single party detail (disabled on nullish id) |
| `useCreatePartyMutation` | hook | `POST {basePath}` — create; 409 surfaces a duplicate-conflict body |
| `useUpdatePartyMutation` | hook | Update identity (name / website / language / timezone) |
| `useSuspendPartyMutation` | hook | Lifecycle: suspend (idempotent; 409 on Archived) |
| `useActivatePartyMutation` | hook | Lifecycle: reactivate a suspended party |
| `useArchivePartyMutation` | hook | Lifecycle: archive (terminal, idempotent) |
| `useAddPartyAddressMutation` | hook | Add a typed address; `useRemovePartyAddressMutation` removes one |
| `useAddPartyEmailMutation` | hook | Add an email; `useRemovePartyEmailMutation` removes one |
| `useAddPartyPhoneMutation` | hook | Add a typed phone; `useRemovePartyPhoneMutation` removes one |
| `useAddPartyExternalMappingMutation` | hook | Register a Stripe/Mollie/Odoo mapping; `useRemove…` clears a provider |
| `useAddPartyRoleMutation` | hook | Add a role flag; `useRemovePartyRoleMutation` removes one (idempotent) |
| `useSetPartyTaxStatusMutation` | hook | Apply a tax status (exempt / reverse-charge); `useClear…` resets it |
| `useReplacePartyMetadataMutation` | hook | Bulk-replace the free-form metadata dictionary |
| `useMergePartyPreviewQuery` | hook | Dry-run merge preview for a (survivor, loser) pair, cached per pair |
| `useMergePartyMutation` | hook | Live merge; auto idempotency key; invalidates list/detail/preview |
| `usePartyDuplicateCandidatesForPartyQuery` | hook | Pending candidate pairs for one party (powers the badge) |
| `useDismissPartyDuplicateMutation` | hook | Mark a candidate pair "not a duplicate" (idempotent) |
| `useMergePartyFromDuplicateMutation` | hook | Merge shortcut from a candidate row; loser inferred server-side |
| `MergeWizard` | component | Side-by-side two-party merge form (BYO modal, unstyled) |
| `DuplicatesInbox` | component | Paginated duplicate-candidate review grid (self-wraps `QueryProvider`) |
| `PartyDuplicatesBadge` | component | Inline "potential duplicates" pill for a party detail page |
| `partiesTranslationsEn` / `…Fr` | const | i18next resource bundles for the `parties` namespace |
| `PartiesConfig` / `PartiesProviderProps` | type | Provider input (optional client / basePath / queryKeyPrefix) + props |
| `CreatePartyMutationVariables` | type | `{ request, options? }` — body plus per-call duplicate-bypass flags |
| `MergePartyMutationVariables` | type | `{ request, idempotencyKey? }` for the live merge |
| `MergePartyFromDuplicateMutationVariables` | type | `{ id, request, idempotencyKey? }` for the candidate-row merge |
| `*Props` | type | Per-component prop types (`MergeWizardProps`, `DuplicatesInboxProps`, …) |

`./testing` subpath (requires the optional `msw` peer):
`createPartiesHandlers` (stateful MSW handlers, default base `/api/v1/parties`),
`partyQueryMetadata` (the `/meta` payload for the duplicates grid), and the
`sampleParty`, `samplePartyId`, `sampleParties`, `sampleDuplicates`, `toListItem`
fixtures.

## Out of scope / caveats

- **Headless.** The in-package components carry only minimal Tailwind utilities
  and **no** modal/dialog chrome — wrap them yourself. The fully-styled admin
  screens (list, create dialog, tabbed detail, taxonomy tags) live in
  [`@granit/react-ui-parties`](../react-ui-parties).
- **Permission gating is the caller's job.** `MergeWizard` and `DuplicatesInbox`
  do **not** check permissions; wrap them in your own guard
  (`PartiesPermissions.Parties.Merge` / `…Manage` / `…Read` from
  [`@granit/parties`](../parties)). Client-side checks are a UX hint, never a
  security boundary — every endpoint re-checks authorization on the .NET backend.
- **Idempotency keys are auto-generated.** `useMergePartyMutation` and
  `useMergePartyFromDuplicateMutation` mint a fresh UUID per submit via
  `generateMergeIdempotencyKey`; pass an explicit `idempotencyKey` only in tests
  or to deliberately replay a previous attempt. Reusing a key with a different
  payload returns `409`.
- **DTOs and HTTP transport** — owned by [`@granit/parties`](../parties) (mirror
  of `Granit.Parties`, contract `contracts/openapi/parties.json`); hooks here
  only adapt them to React Query.
- **Merge engine internals** — conflict resolution, per-field choices and the
  reference-rewriter summary belong to
  [`@granit/react-entity-merge`](../react-entity-merge); this package only adds
  the party-specific summary cards, i18n and error copy.
- **`DuplicatesInbox` needs the query-engine peers.** It self-wraps a
  `<QueryProvider>` from `@granit/react-query-engine` (with
  `{basePath}/duplicates` and an internal `['parties','duplicates','inbox']`
  prefix so the dismiss/merge mutations invalidate it); those peers are optional
  for the rest of the package but required when you render the inbox.

## License

Apache-2.0
