import { useTranslation } from 'react-i18next';

import type { WidgetCatalogEntry } from '../lib/widget-catalog';

/**
 * Editor-side palette listing the widget kinds an app exposes. Each entry
 * surfaces a click-to-add button: pressing it invokes `onAdd(entry)`,
 * which the parent typically routes through {@link addWidget} to mutate
 * the dashboard definition under edit.
 *
 * Drag-from-palette (drop a button into the grid to insert at a specific
 * position) is deferred — keeps the v1 surface tight and avoids a second
 * round of dnd-kit choreography. Apps wanting drag-to-add wrap their own
 * `<DndContext>` around `<EditableDashboard>` + `<WidgetPalette>` and
 * register palette items as additional sortable sources.
 *
 * Labels resolve through `useTranslation()` — when the localization key
 * is missing from the bundle, i18next falls back to the key itself, so
 * dev-mode without translations still surfaces a readable button.
 */
export interface WidgetPaletteProps {
  readonly catalog: readonly WidgetCatalogEntry[];
  readonly onAdd: (entry: WidgetCatalogEntry) => void;
  readonly className?: string;
}

export function WidgetPalette({ catalog, onAdd, className }: WidgetPaletteProps) {
  const { t } = useTranslation();
  return (
    <div
      data-slot="widget-palette"
      role="toolbar"
      aria-label="Widget palette"
      className={className}
    >
      {catalog.map((entry) => (
        <button
          key={entry.type}
          type="button"
          data-slot="widget-palette-item"
          data-widget-type={entry.type}
          onClick={() => onAdd(entry)}
          className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm shadow-sm hover:bg-accent"
        >
          {entry.iconKey ? (
            <span data-slot="widget-palette-icon" data-icon-key={entry.iconKey} aria-hidden />
          ) : null}
          <span data-slot="widget-palette-label">{t(entry.labelLocalizationKey)}</span>
        </button>
      ))}
    </div>
  );
}
