// Granit customizations vs shadcn/ui upstream (new-york-v4):
// - Full rewrite: upstream is a single fixed-size SVG (size-4). Ours adds CVA `size`
//   variants ('sm' = size-4, 'md' = size-8, 'lg' = size-12; default 'md') and applies
//   `text-primary` so spinners pick up the brand color via design tokens.
// Preserve this on any future `shadcn add spinner` overwrite.

import { cn } from '@granit/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2Icon } from 'lucide-react';
import * as React from 'react';

const spinnerVariants = cva('animate-spin text-primary', {
  variants: {
    size: {
      sm: 'size-4',
      md: 'size-8',
      lg: 'size-12',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface SpinnerProps
  extends
    Omit<React.ComponentPropsWithoutRef<typeof Loader2Icon>, 'size'>,
    VariantProps<typeof spinnerVariants> {}

function Spinner({ className, size, ...props }: Readonly<SpinnerProps>) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    />
  );
}

export { Spinner };
