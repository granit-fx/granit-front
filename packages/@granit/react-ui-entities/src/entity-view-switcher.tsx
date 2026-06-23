import { useTranslation } from '@granit/react-localization';
import { cn } from '@granit/utils';
import { Calendar, Images, KanbanSquare, List } from 'lucide-react';

import type { EntityListLayoutKind, EntityListLayoutManifest } from '@granit/entities';
import type { LucideIcon } from 'lucide-react';

const KIND_ICONS: Readonly<Record<EntityListLayoutKind, LucideIcon>> = {
  List: List,
  Kanban: KanbanSquare,
  Calendar: Calendar,
  Gallery: Images,
};

const KIND_LABEL_KEYS: Readonly<Record<EntityListLayoutKind, string>> = {
  List: 'Entity.View.List',
  Kanban: 'Entity.View.Kanban',
  Calendar: 'Entity.View.Calendar',
  Gallery: 'Entity.View.Gallery',
};

const KIND_LABEL_FALLBACKS: Readonly<Record<EntityListLayoutKind, string>> = {
  List: 'List',
  Kanban: 'Kanban',
  Calendar: 'Calendar',
  Gallery: 'Gallery',
};

export interface EntityViewSwitcherProps {
  /**
   * Layouts registered on the entity. Comes from
   * `manifest.collections.listLayouts` (framework contract). The
   * switcher renders nothing when fewer than two layouts are present
   * — a single-layout entity needs no toggle.
   */
  readonly layouts: readonly EntityListLayoutManifest[];
  /** Active layout kind. */
  readonly activeKind: EntityListLayoutKind;
  /** Triggered when the user picks a different kind. */
  readonly onChange: (kind: EntityListLayoutKind) => void;
}

// Tab strip rendered in `<EntityPageLayout>`'s `viewSwitcher` slot —
// always at the same coordinates regardless of entity. Manifest-driven:
// each `EntityListLayoutManifest` renders one tab with the kind's
// standard icon + i18n label. Hides itself entirely when only one
// layout is registered so the slot collapses without leaving an empty
// band.
export function EntityViewSwitcher({ layouts, activeKind, onChange }: EntityViewSwitcherProps) {
  const { t } = useTranslation();

  if (layouts.length < 2) return null;

  return (
    <div
      data-slot="entity-view-switcher"
      role="tablist"
      aria-label={t('Entity.View.Switcher', 'View')}
      className="flex items-center gap-1"
    >
      {layouts.map((layout) => {
        const Icon = KIND_ICONS[layout.kind];
        const label = t(KIND_LABEL_KEYS[layout.kind], KIND_LABEL_FALLBACKS[layout.kind]);
        const isActive = layout.kind === activeKind;
        return (
          <button
            key={layout.kind}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-active={isActive || undefined}
            onClick={() => onChange(layout.kind)}
            className={cn(
              'inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="size-4" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
