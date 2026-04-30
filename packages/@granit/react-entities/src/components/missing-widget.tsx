import type { EntityFormFieldManifest } from '@granit/entities';
import type { ReactNode } from 'react';

interface MissingWidgetProps {
  readonly field: EntityFormFieldManifest;
}

/**
 * Fallback rendered when `field.widget` isn't registered in the catalog.
 * Surfaces the offending widget id so a misconfigured catalog shows up at
 * a glance — silent omission would let the bug rot in production.
 */
export function MissingWidget({ field }: MissingWidgetProps): ReactNode {
  return (
    <div
      data-granit-missing-widget=""
      data-widget={field.widget}
      data-property={field.propertyName}
    >
      Missing widget &ldquo;{field.widget}&rdquo; for {field.propertyName}
    </div>
  );
}
