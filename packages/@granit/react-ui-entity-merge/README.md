# @granit/react-ui-entity-merge

The **react-ui-styled rendering layer** for the generic entity-merge flow. It
provides the `FieldConflictTable` (Survivor / Loser radio-group table styled with
`@granit/react-ui`'s `Alert`) and the complete, label-driven `MergeWizard`
(preview → resolve conflicts → confirm → commit).

This package composes the headless
[`@granit/react-entity-merge`](../react-entity-merge) — its provider, React Query
hooks (`useMergePreview`, `useMergeMutation`, `useFieldChoices`), and the
genuinely-headless building blocks (`MergeConfirmDialog`, native `<dialog>`, and
`ReferenceRewriterSummary`) — with the foundation
[`@granit/react-ui`](../react-ui) components. It owns no DTOs, HTTP calls, or
query keys; those live one and two layers down.

The split follows the **Option-b strict tiers**: everything that touches
`@granit/react-ui` lives in a `react-ui-*` package, so `@granit/react-entity-merge`
stays a pure headless kit (hooks, types, providers, and the native-dialog confirm
step) that consumers can style themselves.

## Layering

- [`@granit/entity-merge`](../entity-merge) — framework-agnostic core: DTOs,
  merge helpers (`resolveWinner`, `classifyMergeError`), Axios functions.
- [`@granit/react-entity-merge`](../react-entity-merge) — React Query hooks,
  `EntityMergeProvider`, and the headless `MergeConfirmDialog` /
  `ReferenceRewriterSummary`.
- **`@granit/react-ui-entity-merge`** (this package) — the styled
  `FieldConflictTable` and `MergeWizard`.

## Exports

| Symbol               | Kind      | Description                                             |
| -------------------- | --------- | ------------------------------------------------------- |
| `MergeWizard`        | component | Full styled flow: preview, resolve, confirm then commit |
| `FieldConflictTable` | component | Radio-group table, one Survivor/Loser choice per field  |
| `*Props` / `*Labels` | type      | Per-component prop and label-bag types                  |

## Usage

```tsx
import { MergeWizard, entityMergeTranslationsEn } from '@granit/react-ui-entity-merge';

<MergeWizard survivorId="s1" loserId="l1" labels={entityMergeTranslationsEn} />;
```

Requires an `<EntityMergeProvider>` and a React Query `<QueryClientProvider>`
ancestor. Permission gating and i18n are the caller's job.
