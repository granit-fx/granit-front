import type { EntityFormFieldManifest } from '@granit/entities';
import type { ReactNode } from 'react';

interface MissingComponentProps {
  readonly field: EntityFormFieldManifest;
}

/**
 * Fallback rendered when `field.component` isn't registered in the
 * catalog. Surfaces the offending component id so a misconfigured
 * catalog shows up at a glance — silent omission would let the bug rot
 * in production.
 */
export function MissingComponent({ field }: MissingComponentProps): ReactNode {
  return (
    <div
      data-granit-missing-component=""
      data-component={field.component}
      data-property={field.propertyName}
    >
      Missing component &ldquo;{field.component}&rdquo; for {field.propertyName}
    </div>
  );
}
