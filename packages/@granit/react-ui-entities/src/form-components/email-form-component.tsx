import { Mail } from 'lucide-react';

import type { EntityFormComponent } from '@granit/react-entities';

export const EmailFormComponent: EntityFormComponent = ({
  field,
  value,
  onChange,
  readOnly,
  errorMessage,
}) => (
  <div className="relative">
    <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    <input
      id={`field-${field.propertyName}`}
      name={field.propertyName}
      type="email"
      value={typeof value === 'string' ? value : ''}
      readOnly={readOnly}
      aria-invalid={errorMessage ? true : undefined}
      onChange={(e) => onChange(e.target.value || null)}
      className="!pl-8"
    />
  </div>
);
