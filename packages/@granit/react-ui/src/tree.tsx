// Presentational tree primitive (shadcn/new-york aesthetic). Headless of data:
// the consumer owns expansion state, lazy loading and node content — this layer
// only supplies the container / row / indentation / chevron styling so domain
// trees (category tree, navigation, file explorers) don't re-implement it.
// Roles follow the WAI-ARIA tree pattern; `aria-expanded` stays on the toggle
// button so keyboard / assistive-tech users get the expand state.

import { cn } from '@granit/utils';
import { ChevronRight } from 'lucide-react';
import * as React from 'react';

/** Indentation step per depth level, in rem. */
const TREE_INDENT_REM = 1.25;

function Tree({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul role="tree" data-slot="tree" className={cn('space-y-px', className)} {...props} />;
}

function TreeItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li role="treeitem" data-slot="tree-item" className={cn(className)} {...props} />;
}

function TreeGroup({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul role="group" data-slot="tree-group" className={cn(className)} {...props} />;
}

/**
 * The clickable row of a node. `level` drives the leading indentation so nested
 * nodes line up with their depth; the hover state spans the full row.
 */
function TreeItemRow({
  level = 0,
  className,
  style,
  ...props
}: React.ComponentProps<'div'> & { readonly level?: number }) {
  return (
    <div
      data-slot="tree-item-row"
      className={cn(
        'group/tree-row flex items-center gap-1 rounded-md py-1 pr-1 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
        className
      )}
      style={{ paddingInlineStart: `${level * TREE_INDENT_REM + 0.25}rem`, ...style }}
      {...props}
    />
  );
}

/** Expand/collapse affordance — a chevron that rotates when `expanded`. */
function TreeItemToggle({
  expanded = false,
  className,
  ...props
}: React.ComponentProps<'button'> & { readonly expanded?: boolean }) {
  return (
    <button
      type="button"
      data-slot="tree-item-toggle"
      aria-expanded={expanded}
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        className
      )}
      {...props}
    >
      <ChevronRight
        className={cn('size-4 transition-transform duration-150', expanded && 'rotate-90')}
      />
    </button>
  );
}

/** Aligns a leaf row with its expandable siblings (matches the toggle width). */
function TreeItemSpacer({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="tree-item-spacer"
      aria-hidden="true"
      className={cn('inline-block size-5 shrink-0', className)}
      {...props}
    />
  );
}

export { Tree, TreeItem, TreeGroup, TreeItemRow, TreeItemToggle, TreeItemSpacer };
