import { useCallback, type KeyboardEvent, type ReactNode } from 'react';

import { useEntityRendererLogger } from '../providers/entity-renderer-provider.js';

import type { EntityActionDispatch } from './use-entity-action-dispatcher.js';
import type { EntityActionManifest } from '@granit/entities';

export interface EntityActionButtonProps {
  /** Full action descriptor — looked up by `name` from `manifest.actions`. */
  readonly action: EntityActionManifest;
  /**
   * Row id substituted into the action's URL template via `{id}`. `null`
   * for entity-scope actions (list-page header) — the .NET builder
   * rejects URL templates with `{id}` on header surfaces at startup.
   */
  readonly rowId: string | null;
  /**
   * Optional row context — passed through to custom action handlers
   * (e.g. workflow transition handler reads `row[workflowState]`).
   */
  readonly row: Readonly<Record<string, unknown>> | null;
  /** Dispatcher returned by `useEntityActionDispatcher()`. */
  readonly dispatch: EntityActionDispatch;
}

/**
 * Renders one entity action as an icon-button. Carries the action
 * metadata as `data-*` attributes so apps can style the button without
 * inspecting React state, and surfaces the localization key as
 * `data-display-key` so the host's `useTranslation()` (or any i18n
 * runtime) can label / tooltip it.
 *
 * The button is a real `<button type="button">` so keyboard activation
 * (Enter / Space) and screen-reader announcements work without extra
 * wiring. `onClick` calls the dispatcher and lets it decide how to
 * carry out the action based on `action.kind`.
 *
 * Hosts that want richer rendering (icon glyphs, tooltips, brand
 * styling) wrap this component or replace it entirely — the `data-*`
 * attributes give CSS-only styling everything it needs.
 */
export function EntityActionButton({
  action,
  rowId,
  row,
  dispatch,
}: EntityActionButtonProps): ReactNode {
  const logger = useEntityRendererLogger();
  const handleClick = useCallback(() => {
    dispatch(action, rowId, row).catch((error: unknown) => {
      logger.error(`EntityAction "${action.name}" failed`, error, {
        actionName: action.name,
      });
    });
  }, [dispatch, action, rowId, row, logger]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    // Native <button> handles Enter / Space already, but we stop
    // propagation so a button click on a card doesn't bubble up to
    // the card's own onClick handler (which would trigger row
    // activation in addition to firing the action).
    if (event.key === 'Enter' || event.key === ' ') {
      event.stopPropagation();
    }
  }, []);

  return (
    <button
      type="button"
      data-granit-entity-action=""
      data-action-name={action.name}
      data-action-kind={action.kind}
      data-action-icon={action.icon ?? undefined}
      data-display-key={action.displayKey ?? undefined}
      onClick={(event) => {
        // Same rationale as keyDown — keep card-level click handlers
        // from racing with action dispatch.
        event.stopPropagation();
        handleClick();
      }}
      onKeyDown={handleKeyDown}
    >
      {action.icon ?? action.displayKey ?? action.name}
    </button>
  );
}

/**
 * Resolves a compact action reference (gallery card / calendar tile /
 * header / kanban card flavours all share the same `{ name, displayKey,
 * icon, contributorAssemblyName }` shape) to its full descriptor in
 * `manifest.actions`. Returns `null` when the lookup fails — typically
 * a misconfigured manifest (compact ref points at an action that's not
 * exposed) or a permission-filtered action; the renderer skips it.
 */
export function resolveAction(
  ref: { readonly name: string },
  actions: readonly EntityActionManifest[] | null
): EntityActionManifest | null {
  if (!actions) return null;
  return actions.find((entry) => entry.name === ref.name) ?? null;
}
