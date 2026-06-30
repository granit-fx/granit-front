import { ICON_COLOR_PATTERN } from '@granit/ai-prompts';
import { getPromptIcon, PROMPT_ICON_IDS } from '@granit/react-ai-prompts';
import { useTranslation } from '@granit/react-localization';
import { Input } from '@granit/react-ui';
import { cn } from '@granit/utils';

export interface IconPickerProps {
  readonly icon: string | null;
  readonly iconColor: string | null;
  readonly onIconChange: (icon: string) => void;
  readonly onColorChange: (color: string) => void;
  readonly className?: string;
}

/** Truncate a color to the 6-digit hex a native `<input type=color>` accepts. */
function toColorInput(color: string | null): string {
  if (color && /^#[0-9a-fA-F]{6}/.test(color)) return color.slice(0, 7);
  return '#3366ff';
}

/**
 * Selects a prompt glyph from the front-owned icon set plus its hex colour. The
 * glyph grid is an ARIA `radiogroup` (a custom roving grid the shadcn
 * `RadioGroup` dot indicator cannot express); the colour fields use the
 * `@granit/react-ui` `Input` primitive so `#RRGGBBAA` alpha stays reachable.
 */
export function IconPicker({
  icon,
  iconColor,
  onIconChange,
  onColorChange,
  className,
}: Readonly<IconPickerProps>) {
  const { t } = useTranslation();
  const colorValid = iconColor === null || iconColor === '' || ICON_COLOR_PATTERN.test(iconColor);

  return (
    <div data-slot="icon-picker" className={cn('flex flex-col gap-2', className)}>
      <div
        role="radiogroup"
        aria-label={t('AiPrompts.IconPicker.IconLabel')}
        className="flex flex-wrap gap-1"
      >
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
                'focus-visible:ring-ring/50 rounded-md border p-1.5 outline-none focus-visible:ring-[3px]',
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
        <Input
          type="color"
          aria-label={t('AiPrompts.IconPicker.ColorLabel')}
          value={toColorInput(iconColor)}
          onChange={(event) => {
            onColorChange(event.target.value);
          }}
          className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <Input
          type="text"
          data-slot="icon-color-hex"
          aria-label={t('AiPrompts.IconPicker.ColorHexLabel')}
          value={iconColor ?? ''}
          placeholder="#RRGGBB"
          aria-invalid={!colorValid}
          onChange={(event) => {
            onColorChange(event.target.value);
          }}
          className={cn('w-28', colorValid ? undefined : 'border-destructive')}
        />
        {!colorValid && (
          <span data-slot="icon-color-error" className="text-destructive text-xs">
            {t('AiPrompts.IconPicker.ColorInvalid')}
          </span>
        )}
      </div>
    </div>
  );
}
