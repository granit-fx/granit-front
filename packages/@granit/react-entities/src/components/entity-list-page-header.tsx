import { type ReactNode } from 'react';

import { EntityActionButton, resolveAction } from '../actions/entity-action-button';
import {
  useEntityActionDispatcher,
  type EntityActionHandlers,
} from '../actions/use-entity-action-dispatcher';

import type { EntityManifestResponse } from '@granit/entities';

export interface EntityListPageHeaderProps {
  /** Entity manifest — provides both `actions` and `collections.headerActions`. */
  readonly manifest: EntityManifestResponse;
  /**
   * Optional per-kind handler overrides forwarded to
   * `useEntityActionDispatcher`. Apps with SPA routers typically
   * override `navigate`; apps with workflow-bearing entities override
   * `workflowTransition` (though `WorkflowTransitionResponse` actions are
   * almost never pinned on the header — they need a row).
   */
  readonly handlers?: EntityActionHandlers;
  /** Optional class for the root element. */
  readonly className?: string;
}

/**
 * Entity-scope action bar surfaced above the list / kanban / calendar /
 * gallery layout tabs (Odoo-style). Reads
 * `manifest.collections.headerActions` (compact references) + looks up
 * each entry's full descriptor in `manifest.actions` to dispatch
 * clicks.
 *
 * Header actions never carry an `{id}` placeholder — the .NET builder
 * rejects misconfigured URL templates at host startup, so the renderer
 * passes `rowId: null` to the dispatcher unconditionally.
 *
 * Renders nothing when the manifest declares no header actions or no
 * actions facet — apps don't need to gate the mount themselves.
 *
 * ```html
 * <div data-granit-entity-list-page-header data-entity="Granit.Parties.Party">
 *   <button data-granit-entity-action data-action-name="import" data-action-kind="Navigate"
 *           data-action-icon="upload" data-display-key="Parties.Action.Import">
 *     upload
 *   </button>
 *   …
 * </div>
 * ```
 *
 * Apps style the buttons with the standard `data-granit-entity-action`
 * selectors (same as Gallery / Calendar / Kanban card actions); the
 * three surfaces share identical icon-button styling so a tenant theme
 * touches one rule.
 */
export function EntityListPageHeader({
  manifest,
  handlers,
  className,
}: EntityListPageHeaderProps): ReactNode {
  const dispatch = useEntityActionDispatcher(handlers);
  const headerActions = manifest.collections?.headerActions ?? [];
  if (headerActions.length === 0) return null;

  return (
    <div
      data-granit-entity-list-page-header=""
      data-entity={manifest.identity?.name}
      className={className}
    >
      {headerActions.map((ref) => {
        const action = resolveAction(ref, manifest.actions);
        if (!action) return null;
        return (
          <EntityActionButton
            key={action.name}
            action={action}
            rowId={null}
            row={null}
            dispatch={dispatch}
          />
        );
      })}
    </div>
  );
}
