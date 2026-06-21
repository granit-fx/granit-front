// Granit customizations vs shadcn/ui upstream (new-york-v4):
// - Removed `next-themes` dependency: theme is received via ToasterProps (default 'system')
//   so the host app controls theme propagation (we use our own ThemeProvider).
// - Custom lucide icons mapped per toast level (success/info/warning/error/loading)
//   for visual parity with the rest of the admin UI.
// - `richColors` enabled so error/warning/success/info toasts render in their semantic
//   palette (red/orange/green/blue) with legible title + description colours.
// - Neutral popover background wired to Granit tokens for the default toast variant.
// Preserve these on any future `shadcn add sonner` overwrite.

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { Toaster as Sonner } from 'sonner';

import type { ToasterProps } from 'sonner';

const Toaster = ({ theme = 'system', ...props }: Readonly<ToasterProps>) => {
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      richColors
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
          // Lighter red palette than Sonner's default richColors red — softer
          // tinted background with a deep red text for legibility.
          '--error-bg': '#fef2f2',
          '--error-text': '#b91c1c',
          '--error-border': '#fca5a5',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
