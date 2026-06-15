import { ICON_COLOR_PATTERN } from '@granit/ai-prompts';
import { cn } from '@granit/utils';

import { defaultPromptLabels } from '../locales/index';

import { getPromptIcon, PROMPT_ICON_IDS } from './icon-registry';

import type { PromptTranslations } from '../locales/index';

export interface IconPickerProps {
  readonly icon: string | null;
  readonly iconColor: string | null;
  readonly onIconChange: (icon: string) => void;
  readonly onColorChange: (color: string) => void;
  readonly labels?: PromptTranslations['IconPicker'];
  readonly className?: string;
}

/** Truncate a color to the 6-digit hex a native `<input type=color>` accepts. */
function toColorInput(color: string | null): string {
  if (color && /^#[0-9a-fA-F]{6}/.test(color)) return color.slice(0, 7);
  return '#3366ff';
}

/**
 * Selects a prompt glyph from the front-owned icon set plus its hex colour.
 * The grid is a `radiogroup`; the colour is editable both as a swatch and as a
 * hex string (so `#RRGGBBAA` alpha is reachable).
 */
export function IconPicker({
  icon,
  iconColor,
  onIconChange,
  onColorChange,
  labels = defaultPromptLabels.IconPicker,
  className,
}: Readonly<IconPickerProps>) {
  const colorValid = iconColor === null || iconColor === '' || ICON_COLOR_PATTERN.test(iconColor);

  return (
    <div data-slot="icon-picker" className={cn('flex flex-col gap-2', className)}>
      <div role="radiogroup" aria-label={labels.IconLabel} className="flex flex-wrap gap-1">
        {PROMPT_ICON_IDS.map((id) => {
          const Glyph = getPromptIcon(id);
          const selected = id === icon;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={id}
              data-slot="icon-option"
              onClick={() => {
                onIconChange(id);
              }}
              className={cn(
                'rounded-md border p-1.5',
                selected ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'
              )}
            >
              <Glyph
                className="size-4"
                aria-hidden
                style={iconColor ? { color: iconColor } : undefined}
              />
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={labels.ColorLabel}
          value={toColorInput(iconColor)}
          onChange={(event) => {
            onColorChange(event.target.value);
          }}
          className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <input
          type="text"
          data-slot="icon-color-hex"
          aria-label={labels.ColorHexLabel}
          value={iconColor ?? ''}
          placeholder="#RRGGBB"
          aria-invalid={!colorValid}
          onChange={(event) => {
            onColorChange(event.target.value);
          }}
          className={cn(
            'w-28 rounded-md border px-2 py-1 text-sm',
            colorValid ? 'border-input' : 'border-destructive'
          )}
        />
        {!colorValid ? (
          <span data-slot="icon-color-error" className="text-destructive text-xs">
            {labels.ColorInvalid}
          </span>
        ) : null}
      </div>
    </div>
  );
}
