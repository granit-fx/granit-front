import { executeBulkAction } from '@granit/entities';
import { useGranitClient } from '@granit/react-api-client';
import { useCallback, useState, type KeyboardEvent, type ReactNode } from 'react';

import { resolveAction } from '../actions/entity-action-button.js';
import {
  useEntityActionDispatcher,
  type EntityActionHandlers,
} from '../actions/use-entity-action-dispatcher.js';
import { useSelection } from '../selection/selection-context.js';

import type {
  BulkActionResponse,
  EntityActionManifest,
  EntityManifestResponse,
  EntitySelectionActionManifest,
} from '@granit/entities';

/**
 * Concurrency cap for selection-bar bulk fan-out. Mirrors the spec
 * pinned in granit-dotnet #1846 — high enough that small selections
 * complete near-instantly, low enough that a 1000-row "archive all"
 * doesn't saturate the host's connection pool.
 */
export const SELECTION_FANOUT_CONCURRENCY_CAP = 10;

export interface EntitySelectionBarRecap {
  /** Ids the fan-out completed without throwing. */
  readonly succeeded: readonly string[];
  /** Per-id failures with the rejection reason (the dispatcher's thrown error). */
  readonly failed: readonly { readonly id: string; readonly error: unknown }[];
  /**
   * Distinct parent markers (`"{ParentEntityName}:{ParentId}"`) returned
   * by the bulk endpoint. Present only when the click routed through
   * `executeBulkAction()` (i.e. `bulkEndpoint` was opt'd in for the
   * action); `undefined` for the per-row fan-out path. Apps consume
   * this list to invalidate exactly the impacted relation-aggregate
   * caches in one step per parent (D3).
   */
  readonly parents?: readonly string[];
}

/**
 * Predicate / flag controlling whether the selection bar should route a
 * given action through the bulk endpoint (one batched POST) instead of
 * the default per-row fan-out (N parallel POSTs capped at 10).
 *
 * Apps opt in when their backend exposes
 * `POST /entities/{name}/bulk/{action}` for the action — the backend
 * owns dedup, and the response surfaces the impacted parents in one
 * step. Set `false` (the default) to keep the per-row fan-out.
 */
export type BulkDispatchPredicate = boolean | ((action: EntitySelectionActionManifest) => boolean);

export interface EntitySelectionBarProps {
  /** Entity manifest — provides `actions[]` + `collections.selectionActions[]`. */
  readonly manifest: EntityManifestResponse;
  /**
   * Per-kind handler overrides forwarded to the underlying
   * `useEntityActionDispatcher`. Apps wire `navigate` / `openModal` /
   * `workflowTransition` here.
   */
  readonly handlers?: EntityActionHandlers;
  /**
   * Called once the fan-out finishes (every id either resolved or
   * rejected). Apps surface a recap toast — typically
   * `{succeeded.length} archived, {failed.length} failed`.
   */
  readonly onComplete?: (
    action: EntitySelectionActionManifest,
    recap: EntitySelectionBarRecap
  ) => void;
  /**
   * Called when the user accepts a confirmation prompt. Apps that want
   * a richer dialog than `globalThis.confirm()` override this slot;
   * return `false` to abort the dispatch (typical: user clicks Cancel).
   * Default uses `globalThis.confirm(action.confirmationKey)`.
   */
  readonly confirm?: (
    action: EntitySelectionActionManifest,
    selectedIds: ReadonlySet<string>
  ) => boolean | Promise<boolean>;
  /**
   * Opt-in: route the click through the bulk endpoint
   * (`POST /entities/{name}/bulk/{action}`) instead of the per-row
   * fan-out. Pass `true` to enable for every selection action, or a
   * predicate to enable per action (typical: a closed allow-list of
   * action names known to support bulk on the host backend).
   *
   * Default: `false` (per-row fan-out — the pre-D2 behaviour).
   */
  readonly bulkEndpoint?: BulkDispatchPredicate;
  /**
   * Override the English defaults for the visible labels (selection
   * summary + clear button). Apps wire `t('entities:SelectionBar.*')`
   * results here from the bundles shipped under `@granit/react-entities`'s
   * `'entities'` namespace.
   */
  readonly labels?: EntitySelectionBarLabels;
  /** Optional class for the root element. */
  readonly className?: string;
}

/**
 * App-supplied label overrides for `<EntitySelectionBar>`. Each entry
 * is optional — omitted keys fall back to English defaults. Shipped
 * separately from the catalog so apps can pass `t()` results directly
 * (with i18next plural resolution baked in via `t('…', { count })`).
 */
export interface EntitySelectionBarLabels {
  /**
   * Summary string rendered next to the selected count. Receives the
   * count so apps can pluralize via `t('entities:SelectionBar.SelectedSummary', { count })`.
   * Default: `"{count} selected"`.
   */
  readonly selectedSummary?: (count: number) => string;
  /** Label for the clear-selection button. Default: `"Clear selection"`. */
  readonly clearSelection?: string;
}

const DEFAULT_LABELS: Required<EntitySelectionBarLabels> = {
  selectedSummary: (count) => `${count} selected`,
  clearSelection: 'Clear selection',
};

/**
 * Selection-bar surface — appears whenever the row-selection set is
 * non-empty (driven by `<SelectionProvider>`). Reads
 * `manifest.collections.selectionActions[]` (compact references) and
 * looks each entry up in `manifest.actions` to dispatch fan-out clicks.
 *
 * Click semantics per the wire contract (granit-dotnet PR #1882):
 *
 * 1. Confirm via `confirm()` slot when `action.confirmationKey` is set
 *    (default uses `globalThis.confirm`). Bail out if the user declines.
 * 2. Iterate `selectedIds`, substitute `{id}` per id into
 *    `action.urlTemplate`, fire the dispatcher per id with concurrency
 *    capped at {@link SELECTION_FANOUT_CONCURRENCY_CAP}.
 * 3. Emit a per-id recap (succeeded / failed) through `onComplete`.
 *    Hosts surface the recap as a toast; the framework leaves the
 *    visual to the app since toast UX is host-specific.
 *
 * Renders `null` when the manifest declares no selection actions OR
 * when nothing is selected — apps don't need to gate the mount
 * themselves.
 *
 * ```html
 * <div data-granit-entity-selection-bar data-entity="…" data-selected-count="3">
 *   <span data-granit-selection-bar-summary>3 selected</span>
 *   <button data-granit-entity-action data-action-name="archive" …>archive</button>
 *   <button data-granit-selection-bar-clear>Clear selection</button>
 * </div>
 * ```
 */
export function EntitySelectionBar({
  manifest,
  handlers,
  onComplete,
  confirm,
  bulkEndpoint,
  labels,
  className,
}: EntitySelectionBarProps): ReactNode {
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };
  const dispatch = useEntityActionDispatcher(handlers);
  const client = useGranitClient();
  const selection = useSelection();
  const [running, setRunning] = useState<string | null>(null);

  const selectionActions = manifest.collections?.selectionActions ?? [];

  const handleClick = useCallback(
    async (ref: EntitySelectionActionManifest, action: EntityActionManifest) => {
      if (running) return;
      const ids = Array.from(selection.selectedIds);
      if (ids.length === 0) return;

      // Confirmation dialog — defaults to globalThis.confirm; apps can
      // override for shadcn / Radix dialogs.
      const confirmationKey = ref.confirmationKey ?? action.confirmationKey;
      if (confirmationKey) {
        const proceed = confirm
          ? await confirm(ref, selection.selectedIds)
          : globalThis.confirm(confirmationKey);
        if (!proceed) return;
      }

      const useBulk =
        typeof bulkEndpoint === 'function' ? bulkEndpoint(ref) : bulkEndpoint === true;
      const entityName = manifest.identity?.name;

      setRunning(ref.name);
      try {
        const recap =
          useBulk && entityName
            ? await dispatchBulk(client, entityName, ref.name, ids)
            : await fanOutWithCap(
                ids,
                (id) =>
                  dispatch(action, id, null).then(
                    () => ({ kind: 'ok' as const, id }),
                    (error: unknown) => ({ kind: 'err' as const, id, error })
                  ),
                SELECTION_FANOUT_CONCURRENCY_CAP
              );
        onComplete?.(ref, recap);
        // Best-effort: clear the selection on full success so the user
        // doesn't accidentally re-fire on the same set. Failures are
        // kept selected so the user can retry.
        if (recap.failed.length === 0) {
          selection.clear();
        } else {
          selection.setSelected(recap.failed.map((f) => f.id));
        }
      } finally {
        setRunning(null);
      }
    },
    [
      running,
      selection,
      dispatch,
      confirm,
      onComplete,
      bulkEndpoint,
      client,
      manifest.identity?.name,
    ]
  );

  if (selectionActions.length === 0 || selection.size === 0) return null;

  return (
    <div
      data-granit-entity-selection-bar=""
      data-entity={manifest.identity?.name}
      data-selected-count={selection.size}
      className={className}
    >
      <span data-granit-selection-bar-summary="">
        {mergedLabels.selectedSummary(selection.size)}
      </span>
      {selectionActions.map((ref) => {
        const action = resolveAction(ref, manifest.actions);
        if (!action) return null;
        const isRunning = running === ref.name;
        return (
          <button
            key={ref.name}
            type="button"
            data-granit-entity-action=""
            data-action-name={action.name}
            data-action-kind={action.kind}
            data-action-icon={action.icon ?? undefined}
            data-display-key={ref.displayKey ?? action.displayKey ?? undefined}
            data-running={isRunning ? '' : undefined}
            disabled={isRunning || running !== null}
            onClick={() => {
              handleClick(ref, action).catch((error: unknown) => {
                globalThis.console.error(`Selection action "${ref.name}" failed:`, error);
              });
            }}
            onKeyDown={swallowEnterSpace}
          >
            {ref.icon ?? ref.displayKey ?? ref.name}
          </button>
        );
      })}
      <button
        type="button"
        data-granit-selection-bar-clear=""
        onClick={() => selection.clear()}
        disabled={running !== null}
      >
        {mergedLabels.clearSelection}
      </button>
    </div>
  );
}

/**
 * Single-shot bulk dispatch. Calls
 * `POST /entities/{name}/bulk/{action}` with all ids and maps the
 * response into the existing recap shape (`succeeded` / `failed`)
 * extended with `parents` for downstream cache-eviction wiring (D3).
 *
 * If the endpoint itself rejects (network / 4xx / 5xx), every id is
 * surfaced as failed against the same root error — the user-visible
 * recap stays uniform between the bulk and fan-out paths.
 */
async function dispatchBulk(
  client: Parameters<typeof executeBulkAction>[0],
  entityName: string,
  actionName: string,
  ids: readonly string[]
): Promise<EntitySelectionBarRecap> {
  let response: BulkActionResponse;
  try {
    response = await executeBulkAction(client, entityName, actionName, { ids });
  } catch (error) {
    return {
      succeeded: [],
      failed: ids.map((id) => ({ id, error })),
    };
  }
  return {
    succeeded: response.ok,
    failed: response.failed.map((f) => ({ id: f.id, error: f })),
    parents: response.parents,
  };
}

function swallowEnterSpace(event: KeyboardEvent<HTMLButtonElement>): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.stopPropagation();
  }
}

interface FanOutOk {
  readonly kind: 'ok';
  readonly id: string;
}
interface FanOutErr {
  readonly kind: 'err';
  readonly id: string;
  readonly error: unknown;
}
type FanOutResult = FanOutOk | FanOutErr;

/**
 * Concurrency-capped fan-out over the supplied ids. `task` is called
 * with each id and must always resolve (never throw) to a tagged
 * `FanOutResult` — the dispatcher's `dispatch().then(ok, err)` pattern
 * does that conversion. The function maintains at most `cap` in-flight
 * tasks at any time; results land in declaration order via the recap
 * groupings. Used by `<EntitySelectionBar>` for the
 * granit-dotnet #1882 selection-bar bulk fan-out.
 */
export async function fanOutWithCap(
  ids: readonly string[],
  task: (id: string) => Promise<FanOutResult>,
  cap: number
): Promise<EntitySelectionBarRecap> {
  const succeeded: string[] = [];
  const failed: { id: string; error: unknown }[] = [];
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < ids.length) {
      const idx = cursor++;
      const id = ids[idx];
      if (id === undefined) continue;
      const result = await task(id);
      if (result.kind === 'ok') {
        succeeded.push(result.id);
      } else {
        failed.push({ id: result.id, error: result.error });
      }
    }
  }

  const workerCount = Math.max(1, Math.min(cap, ids.length));
  const workers: Promise<void>[] = [];
  for (let i = 0; i < workerCount; i += 1) {
    workers.push(worker());
  }
  await Promise.all(workers);

  return { succeeded, failed };
}
