import type { ReactNode } from 'react';

/**
 * Shared vocabulary for the Grafana-style segmented "pill" toolbars
 * (time-window + refresh): the container / segment classes and the line-icon
 * set. Kept icon-library-free (inline lucide-geometry SVGs) so the headless
 * `@granit/react-dashboards` tier stays dependency-light and usable on every
 * dashboard surface.
 */

/** Rounded, bordered pill that groups segments separated by `border-l`. */
export const PILL_CLASS =
  'inline-flex h-9 items-stretch overflow-hidden rounded-md border bg-background text-sm shadow-sm';

/** A flanking icon/text segment of the pill. */
export const SEGMENT_BUTTON_CLASS =
  'flex items-center gap-1.5 px-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground';

export function joinClasses(...parts: ReadonlyArray<string | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Line-icon wrapper (lucide-style geometry). */
function Icon({ children, className }: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className ?? 'h-4 w-4'}
    >
      {children}
    </svg>
  );
}

export function ClockIcon({ className }: { readonly className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Icon>
  );
}

export function ChevronDownIcon({ className }: { readonly className?: string }) {
  return (
    <Icon className={className}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function ChevronsLeftIcon() {
  return (
    <Icon>
      <path d="m11 17-5-5 5-5" />
      <path d="m18 17-5-5 5-5" />
    </Icon>
  );
}

export function ChevronsRightIcon() {
  return (
    <Icon>
      <path d="m6 17 5-5-5-5" />
      <path d="m13 17 5-5-5-5" />
    </Icon>
  );
}

export function ZoomOutIcon() {
  return (
    <Icon>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
      <path d="M8 11h6" />
    </Icon>
  );
}

export function RefreshIcon({ className }: { readonly className?: string }) {
  return (
    <Icon className={className}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </Icon>
  );
}
