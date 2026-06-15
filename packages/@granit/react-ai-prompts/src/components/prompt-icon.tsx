import { cn } from '@granit/utils';

import { getPromptIcon } from './icon-registry';

export interface PromptIconProps {
  /** Icon identifier from the catalogue (mapped via the glyph registry). */
  readonly icon: string | null | undefined;
  /** Hex colour `#RRGGBB` / `#RRGGBBAA` applied to the glyph. */
  readonly iconColor?: string | null;
  readonly className?: string;
}

/** Renders a prompt's glyph in its configured colour. */
export function PromptIcon({ icon, iconColor, className }: Readonly<PromptIconProps>) {
  const Glyph = getPromptIcon(icon);
  return (
    <Glyph
      data-slot="prompt-icon"
      aria-hidden
      className={cn('size-4', className)}
      style={iconColor ? { color: iconColor } : undefined}
    />
  );
}
