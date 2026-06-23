import { useEntityActionDispatcher, type EntityActionHandlers } from '@granit/react-entities';
import { useTranslation } from '@granit/react-localization';
import { resolveLabel } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { Download, ExternalLink, PanelRightOpen, Play, SquarePen, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { logger } from './logger';

import type { EntityActionManifest } from '@granit/entities';

// Showcase-styled wrapper around the framework's entity action
// dispatcher. Renders a shadcn `<Button>` whose visual is derived from
// `action.kind` so the design system stays in charge of how each kind
// reads (download = outline + download icon, ApiCall with confirmation =
// destructive, etc.). The dispatcher itself is the canonical one from
// `@granit/react-entities` — we just style its trigger.
//
// `Navigate` actions are typically routed through the parent's
// `actionHandlers.navigate` override (see `WorkspaceEntityContent`) so
// React Router stays in charge instead of falling back to the framework
// default (`globalThis.location.href`). The detail page passes its own
// override here as well.

interface VariantSpec {
  readonly variant: 'default' | 'outline' | 'destructive';
  readonly Icon: typeof Download | null;
}

function variantFor(action: EntityActionManifest): VariantSpec {
  switch (action.kind) {
    case 'Download':
      return { variant: 'outline', Icon: Download };
    case 'Navigate':
      return { variant: 'outline', Icon: ExternalLink };
    case 'WorkflowTransition':
      return { variant: 'default', Icon: Play };
    case 'OpenDrawer':
      return { variant: 'outline', Icon: PanelRightOpen };
    case 'OpenModal':
      return { variant: 'outline', Icon: SquarePen };
    case 'ApiCall':
      return action.confirmationKey
        ? { variant: 'destructive', Icon: Trash2 }
        : { variant: 'default', Icon: null };
  }
}

export interface EntityActionButtonProps {
  readonly action: EntityActionManifest;
  readonly entityId: string;
  /**
   * Optional per-kind handler overrides forwarded to the dispatcher.
   * Apps with SPA routers typically wire `navigate` here.
   */
  readonly actionHandlers?: EntityActionHandlers;
}

export function EntityActionButton({ action, entityId, actionHandlers }: EntityActionButtonProps) {
  const { t } = useTranslation();
  const dispatch = useEntityActionDispatcher(actionHandlers);
  const [pending, setPending] = useState(false);

  const label = resolveLabel(action.displayKey, action.name);
  const { variant, Icon } = variantFor(action);

  const handleClick = async () => {
    if (pending) return;
    setPending(true);
    try {
      await dispatch(action, entityId, null);
    } catch (error: unknown) {
      logger.error(`[EntityAction] "${action.name}" failed`, error);
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleClick}
      disabled={pending}
      data-slot="entity-action-button"
      data-action-name={action.name}
      data-action-kind={action.kind}
      aria-label={label}
      title={label}
    >
      {Icon && <Icon className="mr-2 size-4" aria-hidden="true" />}
      {label || t('Entity.Action.Default', 'Action')}
    </Button>
  );
}
