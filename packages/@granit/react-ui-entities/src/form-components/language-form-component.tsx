import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@granit/react-ui';
import { useLanguages } from '@granit/react-ui-localization';

import type { EntityFormComponent } from '@granit/react-entities';

export const LanguageFormComponent: EntityFormComponent = ({
  field,
  value,
  onChange,
  readOnly,
}) => {
  const languages = useLanguages();
  const current = typeof value === 'string' ? value : '';
  return (
    <Select value={current} onValueChange={(next) => onChange(next || null)} disabled={readOnly}>
      <SelectTrigger id={`field-${field.propertyName}`} className="w-full">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        {languages.map(({ cultureName, displayName }) => (
          <SelectItem key={cultureName} value={cultureName}>
            {displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
