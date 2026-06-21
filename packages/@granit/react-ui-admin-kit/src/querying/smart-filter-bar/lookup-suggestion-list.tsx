// ---------------------------------------------------------------------------
// LookupSuggestionList — renders lookup items as cmdk suggestions
// ---------------------------------------------------------------------------
//
// Mounted by SmartFilterBar only when the selected field declares a lookup
// source (`FilterableField.lookup` set). Uses `useLookup` to fetch items
// debounced against the current input value, and honors the Empty Scope Trap
// via `missingScopeKey` when the descriptor declares `scopeKeys`.

import { useGranitClient } from '@granit/react-api-client';
import { useLookup } from '@granit/react-data-lookup';
import { useLocale } from '@granit/react-localization';
import { Command } from 'cmdk';
import { CheckIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { LookupDescriptor } from '@granit/data-lookup';
import type { FilterToken } from '@granit/query-engine';

export interface LookupSuggestionListProps {
  readonly descriptor: LookupDescriptor;
  readonly search: string;
  readonly tokens: readonly FilterToken[];
  readonly multi: boolean;
  readonly selectedValuesCsv: string;
  readonly onPickSingle: (value: string) => void;
  readonly onPickMulti: (nextCsv: string) => void;
}

function extractScope(
  tokens: readonly FilterToken[],
  scopeKeys: readonly string[] | undefined
): Readonly<Record<string, string | undefined>> | undefined {
  if (!scopeKeys || scopeKeys.length === 0) return undefined;
  const scope: Record<string, string | undefined> = {};
  for (const key of scopeKeys) {
    const lower = key.toLowerCase();
    const match = tokens.find(
      (t) =>
        t.type === 'filter' &&
        t.field?.toLowerCase() === lower &&
        t.operator === 'Eq' &&
        typeof t.value === 'string'
    );
    scope[key] = match?.value;
  }
  return scope;
}

export function LookupSuggestionList({
  descriptor,
  search,
  tokens,
  multi,
  selectedValuesCsv,
  onPickSingle,
  onPickMulti,
}: Readonly<LookupSuggestionListProps>) {
  const { t } = useTranslation();
  const client = useGranitClient();
  const { locale } = useLocale();

  const scope = useMemo(
    () => extractScope(tokens, descriptor.scopeKeys),
    [tokens, descriptor.scopeKeys]
  );

  const query = useLookup(descriptor, { search, pageSize: 25, scope }, { client, culture: locale });

  const selectedSet = useMemo<ReadonlySet<string>>(() => {
    if (!multi || !selectedValuesCsv) return new Set();
    return new Set(
      selectedValuesCsv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
  }, [multi, selectedValuesCsv]);

  if (query.missingScopeKey) {
    return (
      <Command.Empty
        data-slot="lookup-missing-scope"
        className="px-3 py-6 text-sm text-muted-foreground"
      >
        {t('Components.Querying.SmartFilter.Lookup.MissingScope', {
          key: query.missingScopeKey,
          defaultValue: `Pick a {{key}} first`,
        })}
      </Command.Empty>
    );
  }

  if (query.isLoading) {
    return (
      <Command.Empty data-slot="lookup-loading" className="px-3 py-6 text-sm text-muted-foreground">
        {t('Components.Querying.SmartFilter.Lookup.Loading', { defaultValue: 'Loading…' })}
      </Command.Empty>
    );
  }

  const items = query.items;

  if (items.length === 0) {
    return (
      <Command.Empty data-slot="lookup-empty" className="px-3 py-6 text-sm text-muted-foreground">
        {t('Components.Querying.SmartFilter.Lookup.NoMatches', {
          defaultValue: 'No matches',
        })}
      </Command.Empty>
    );
  }

  return (
    <Command.List data-slot="lookup-suggestion-list" className="max-h-72 overflow-y-auto p-1.5">
      {items.map((item) => {
        const stringValue = String(item.value);
        const isSelected = multi && selectedSet.has(stringValue);
        return (
          <Command.Item
            key={stringValue}
            value={stringValue}
            data-slot="lookup-suggestion-item"
            onSelect={() => {
              if (multi) {
                const next = isSelected
                  ? [...selectedSet].filter((v) => v !== stringValue)
                  : [...selectedSet, stringValue];
                onPickMulti(next.join(', '));
              } else {
                onPickSingle(stringValue);
              }
            }}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
          >
            {multi && (
              <CheckIcon className={`size-4 ${isSelected ? 'text-primary' : 'text-transparent'}`} />
            )}
            <span className="font-medium">{item.label}</span>
          </Command.Item>
        );
      })}
    </Command.List>
  );
}
