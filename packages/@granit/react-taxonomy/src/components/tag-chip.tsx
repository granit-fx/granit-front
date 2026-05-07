import type { TagResponse } from '@granit/taxonomy';
import type { CSSProperties, ReactNode } from 'react';

export interface TagChipProps {
  readonly tag: TagResponse;
  /** Show the remove `×` and call this back on click. Omit to render a static chip. */
  readonly onRemove?: (tag: TagResponse) => void;
  readonly removeLabel?: string;
  readonly className?: string;
}

const FALLBACK_TEXT_LIGHT = '#ffffff';
const FALLBACK_TEXT_DARK = '#111827';

/**
 * Compute a readable text color for a hex background using a relative
 * luminance threshold. Defensive against malformed input — falls back to
 * dark text when the hex doesn't match the canonical `#RRGGBB` shape.
 */
function pickTextColor(background: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(background)) return FALLBACK_TEXT_DARK;
  const r = parseInt(background.slice(1, 3), 16);
  const g = parseInt(background.slice(3, 5), 16);
  const b = parseInt(background.slice(5, 7), 16);
  // Rec. 709 luma — close enough for chip readability.
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luma > 0.6 ? FALLBACK_TEXT_DARK : FALLBACK_TEXT_LIGHT;
}

/**
 * Headless tag chip. Renders the tag name on the tag's color with a
 * contrast-aware text color. The component carries no design-system
 * dependency — apps style via `className` plus the `data-granit-tag-chip*`
 * attributes (mirroring the rest of the framework).
 */
export function TagChip({
  tag,
  onRemove,
  removeLabel = 'Remove',
  className,
}: TagChipProps): ReactNode {
  const style: CSSProperties = {
    backgroundColor: tag.color,
    color: pickTextColor(tag.color),
  };

  return (
    <span
      data-granit-tag-chip=""
      data-granit-tag-id={tag.id}
      data-granit-tag-scope={tag.scope}
      data-granit-tag-hidden-on-card={tag.hideOnEntityCard ? '' : undefined}
      style={style}
      className={className}
    >
      <span data-granit-tag-chip-label="">{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          data-granit-tag-chip-remove=""
          aria-label={`${removeLabel} ${tag.name}`}
          onClick={() => onRemove(tag)}
        >
          ×
        </button>
      )}
    </span>
  );
}
