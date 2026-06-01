import { useCallback } from 'react';

import { useWidgetActionDispatcher } from '../components/widget-action-context';

import type { WidgetAction, WidgetActionTrigger } from '@granit/dashboards';

/**
 * Returns an `onClick`-style callback that dispatches every
 * {@link WidgetAction} matching the given {@link WidgetActionTrigger},
 * or `null` when no action is wired (so consumers can attach the
 * handler conditionally and skip the cursor / a11y affordances when
 * there's nothing to fire).
 *
 * Dispatches happen through the surrounding {@link WidgetActionProvider}
 * (or the framework defaults), so placeholder substitution
 * (`${row.x}`, `${aliasName}`) and view-setter wiring
 * happen automatically.
 *
 * Multiple actions on the same trigger fire in declaration order —
 * matches the backend's `WidgetDefinitionBase.Actions` semantics
 * (the action list is intentionally ordered, not a set).
 *
 * @example
 *   function MarkdownWidget({ widget }) {
 *     const onClick = useWidgetTriggerHandler('Click', widget.actions);
 *     return (
 *       <div
 *         onClick={onClick ?? undefined}
 *         className={onClick ? 'cursor-pointer' : ''}
 *         role={onClick ? 'button' : undefined}
 *       >
 *         {body}
 *       </div>
 *     );
 *   }
 */
export function useWidgetTriggerHandler(
  trigger: WidgetActionTrigger,
  actions: readonly WidgetAction[] | null | undefined
): ((data?: Readonly<Record<string, unknown>>) => void) | null {
  const dispatch = useWidgetActionDispatcher();

  const handler = useCallback(
    (data?: Readonly<Record<string, unknown>>) => {
      if (!actions) return;
      for (const action of actions) {
        if (action.trigger === trigger) dispatch(action, data);
      }
    },
    [dispatch, trigger, actions]
  );

  if (!actions || actions.length === 0) return null;
  if (!actions.some((a) => a.trigger === trigger)) return null;
  return handler;
}
