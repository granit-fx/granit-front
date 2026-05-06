import { useCallback, useState, type KeyboardEvent, type ReactNode } from 'react';

import { resolveAction } from '../actions/entity-action-button.js';
import {
  useEntityActionDispatcher,
  type EntityActionHandlers,
} from '../actions/use-entity-action-dispatcher.js';
import { useSelection } from '../selection/selection-context.js';

import type {
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
}

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
  /** Optional class for the root element. */
  readonly className?: string;
}

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
  className,
}: EntitySelectionBarProps): ReactNode {
  const dispatch = useEntityActionDispatcher(handlers);
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

      setRunning(ref.name);
      try {
        const recap = await fanOutWithCap(
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
    [running, selection, dispatch, confirm, onComplete]
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
        {selection.size} selected
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
        Clear selection
      </button>
    </div>
  );
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
