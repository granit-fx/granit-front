// ---------------------------------------------------------------------------
// FilterPresets — toggle buttons for preset filter groups (Story #53)
// ---------------------------------------------------------------------------

import { Button, Separator, Tooltip, TooltipContent, TooltipTrigger } from '@granit/react-ui';

import type { FilterGroupMeta } from '@granit/query-engine';

export interface FilterPresetsProps {
  /** Preset groups from metadata. */
  readonly groups: readonly FilterGroupMeta[];
  /** Currently active presets by group. */
  readonly activePresets: Readonly<Record<string, readonly string[]>>;
  /** Callback when a preset is toggled. */
  readonly onToggle: (group: string, names: readonly string[]) => void;
  /** CSS class for the root container. */
  readonly className?: string;
}

/**
 * Renders filter preset groups as toggle button rows (Odoo-style).
 *
 * Each group is a row of buttons. Within a group, selecting a preset
 * deselects the others (OR semantics). Between groups, filters combine (AND).
 *
 * @example
 * ```tsx
 * <FilterPresets
 *   groups={meta.presetFilterGroups}
 *   activePresets={params.presets ?? {}}
 *   onToggle={setPresets}
 * />
 * ```
 */
export function FilterPresets({
  groups,
  activePresets,
  onToggle,
  className,
}: Readonly<FilterPresetsProps>) {
  if (groups.length === 0) return null;

  return (
    <div data-slot="filter-presets" className={className}>
      {groups.map((group, groupIndex) => (
        <div key={group.name}>
          {groupIndex > 0 && <Separator className="my-2" />}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-muted-foreground">{group.label}</span>
            {group.presets.map((preset) => {
              const active = activePresets[group.name]?.includes(preset.name) ?? false;
              return (
                <Tooltip key={preset.name}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={active ? 'default' : 'outline'}
                      size="sm"
                      data-slot="filter-preset-button"
                      data-active={active}
                      onClick={() => {
                        if (active) {
                          onToggle(group.name, []);
                        } else {
                          onToggle(group.name, [preset.name]);
                        }
                      }}
                    >
                      {preset.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {active ? `Remove ${preset.label} filter` : `Filter by ${preset.label}`}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
