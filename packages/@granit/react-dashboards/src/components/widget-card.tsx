import type { ReactNode } from 'react';

/**
 * Visual frame for every dashboard widget — title row + body slot.
 *
 * Decoupled from `<WidgetRenderer>` so consumers can opt out of the frame
 * (an Image widget that should bleed to the edges of its grid cell, for
 * instance) by rendering the body directly. Default styling matches the
 * shadcn `<Card>` aesthetic without taking a hard dep on it.
 */
export interface WidgetCardProps {
  readonly title?: string;
  readonly children: ReactNode;
  readonly className?: string;
}

export function WidgetCard({ title, children, className }: WidgetCardProps) {
  const root = ['flex h-full flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div data-slot="widget-card" className={root}>
      {title ? (
        <header data-slot="widget-card-header">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </header>
      ) : null}
      <div data-slot="widget-card-body" className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
