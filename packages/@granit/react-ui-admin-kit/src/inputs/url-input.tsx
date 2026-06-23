import { useTranslation } from '@granit/react-localization';
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@granit/react-ui';
import { cn } from '@granit/utils';
import { useState } from 'react';

interface UrlInputProps {
  readonly value: string | null;
  readonly onChange: (value: string | null) => void;
  readonly protocols?: readonly string[];
  readonly defaultProtocol?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly id?: string;
  readonly name?: string;
  readonly className?: string;
  readonly ariaLabelProtocol?: string;
}

const PROTOCOL_PATTERN = /^([a-z][a-z0-9+.-]*):\/\//i;

interface SplitUrl {
  readonly protocol: string;
  readonly rest: string;
}

function splitUrl(value: string | null, protocols: readonly string[], fallback: string): SplitUrl {
  if (!value) return { protocol: fallback, rest: '' };
  const match = PROTOCOL_PATTERN.exec(value);
  if (match) {
    const detected = match[1]?.toLowerCase() ?? fallback;
    const protocol = protocols.includes(detected) ? detected : fallback;
    return { protocol, rest: value.slice(match[0].length) };
  }
  return { protocol: fallback, rest: value };
}

function joinUrl(protocol: string, rest: string): string | null {
  const trimmed = rest.trim();
  if (!trimmed) return null;
  return `${protocol}://${trimmed}`;
}

export function UrlInput({
  value,
  onChange,
  protocols = ['https', 'http'],
  defaultProtocol,
  placeholder,
  disabled,
  id,
  name,
  className,
  ariaLabelProtocol,
}: UrlInputProps) {
  const { t } = useTranslation();
  const fallback = defaultProtocol ?? protocols[0] ?? 'https';

  // Normalize: callers may pass `''` (RHF default) or `null` interchangeably.
  // Without this, the null ↔ '' round-trip through onChange would re-trigger
  // the sync block below and reset the user's protocol choice to the fallback.
  const normalizedValue = value && value.length > 0 ? value : null;

  const [state, setState] = useState(() => {
    const split = splitUrl(normalizedValue, protocols, fallback);
    return { ...split, syncedValue: normalizedValue };
  });

  // Reconcile with external value changes (form reset, fetched data).
  if (normalizedValue !== state.syncedValue) {
    const split = splitUrl(normalizedValue, protocols, fallback);
    setState({ ...split, syncedValue: normalizedValue });
  }
  const { protocol, rest } = state;

  const emit = (nextProtocol: string, nextRest: string) => {
    const joined = joinUrl(nextProtocol, nextRest);
    setState({ protocol: nextProtocol, rest: nextRest, syncedValue: joined });
    onChange(joined);
  };

  const handleProtocolChange = (next: string) => emit(next, rest);

  const handleRestChange = (raw: string) => {
    // If user pasted a full URL, re-split so the dropdown reflects it.
    const match = PROTOCOL_PATTERN.exec(raw);
    if (match) {
      const detected = match[1]?.toLowerCase() ?? protocol;
      const nextProtocol = protocols.includes(detected) ? detected : protocol;
      emit(nextProtocol, raw.slice(match[0].length));
      return;
    }
    emit(protocol, raw);
  };

  return (
    <div data-slot="url-input" className={cn('flex w-full', disabled && 'opacity-60', className)}>
      <Select value={protocol} onValueChange={handleProtocolChange} disabled={disabled}>
        <SelectTrigger
          aria-label={ariaLabelProtocol ?? t('Common.Url.Protocol', 'Protocol')}
          data-slot="url-input-protocol"
          className="w-[112px] shrink-0 rounded-r-none border-r-0 font-mono text-xs leading-5 tabular-nums"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {protocols.map((p) => (
            <SelectItem key={p} value={p} className="font-mono text-xs leading-5">
              {p}://
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        name={name}
        type="text"
        inputMode="url"
        autoComplete="url"
        disabled={disabled}
        value={rest}
        onChange={(e) => handleRestChange(e.target.value)}
        placeholder={placeholder ?? t('Common.Url.Placeholder', 'example.com')}
        data-slot="url-input-rest"
        className="flex-1 rounded-l-none"
      />
    </div>
  );
}
