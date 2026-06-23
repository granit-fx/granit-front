import { useTranslation } from '@granit/react-localization';
import { Textarea } from '@granit/react-ui';
import { cn } from '@granit/utils';
import { useCallback, useState } from 'react';

interface TestDataEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TestDataEditor({ value, onChange, className }: Readonly<TestDataEditorProps>) {
  const { t } = useTranslation();
  const [isValid, setIsValid] = useState(true);

  const handleChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
      try {
        if (newValue.trim()) {
          JSON.parse(newValue);
        }
        setIsValid(true);
      } catch {
        setIsValid(false);
      }
    },
    [onChange]
  );

  return (
    <div data-slot="test-data-editor" className={className}>
      <Textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className={cn('min-h-[200px] font-mono text-sm', !isValid && 'border-destructive')}
        placeholder='{ "key": "value" }'
        aria-invalid={!isValid}
        aria-describedby={isValid ? undefined : 'test-data-error'}
      />
      {!isValid && (
        <p id="test-data-error" className="mt-1 text-xs text-destructive">
          {t('Templates.TestData.InvalidJson', 'Invalid JSON')}
        </p>
      )}
    </div>
  );
}
