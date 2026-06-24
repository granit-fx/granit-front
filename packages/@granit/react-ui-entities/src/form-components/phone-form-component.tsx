import { PhoneInput } from '@granit/react-ui-kit';

import type { EntityFormComponent } from '@granit/react-entities';

export const PhoneFormComponent: EntityFormComponent = ({ field, value, onChange, readOnly }) => (
  <PhoneInput
    id={`field-${field.propertyName}`}
    name={field.propertyName}
    value={typeof value === 'string' ? value : null}
    onChange={(next) => onChange(next ?? null)}
    disabled={readOnly}
  />
);
