import { useTranslation } from '@granit/react-localization';
import { useReplacePartyMetadataMutation } from '@granit/react-parties';
import { Alert, AlertDescription, toast, Button, Input } from '@granit/react-ui';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { logger } from '../logger';
import { metadataLimits } from '../validation';

import type { PartyId } from '@granit/parties';

interface MetadataEntry {
  id: string;
  key: string;
  value: string;
}

interface MetadataTabProps {
  readonly partyId: PartyId;
  readonly metadata: Readonly<Record<string, string>>;
}

function toEntries(record: Readonly<Record<string, string>>): MetadataEntry[] {
  return Object.entries(record).map(([key, value]) => ({
    id: crypto.randomUUID(),
    key,
    value,
  }));
}

function entriesToRecord(entries: readonly MetadataEntry[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const { key, value } of entries) {
    const trimmed = key.trim();
    if (trimmed) result[trimmed] = value;
  }
  return result;
}

export function MetadataTab({ partyId, metadata }: MetadataTabProps) {
  const { t } = useTranslation();
  const mutation = useReplacePartyMetadataMutation();
  const [entries, setEntries] = useState<MetadataEntry[]>(() => toEntries(metadata));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEntries(toEntries(metadata));
  }, [metadata]);

  const handleAdd = () => {
    if (entries.length >= metadataLimits.entriesMax) {
      setError(t('Parties.Metadata.MaxEntries', { max: metadataLimits.entriesMax }));
      return;
    }
    setError(null);
    setEntries([...entries, { id: crypto.randomUUID(), key: '', value: '' }]);
  };

  const handleChange = (index: number, patch: Partial<MetadataEntry>) => {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  };

  const handleRemove = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setError(null);
    const keys = entries.map((e) => e.key.trim()).filter(Boolean);
    const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
    if (duplicates.length > 0) {
      setError(t('Parties.Metadata.DuplicateKeys'));
      return;
    }
    try {
      await mutation.mutateAsync({
        id: partyId,
        request: { metadata: entriesToRecord(entries) },
      });
      toast.success(t('Parties.Metadata.SaveSuccess'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[MetadataTab] save metadata failed', err);
    }
  };

  return (
    <div data-slot="metadata-tab" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{t('Parties.Metadata.Title')}</h3>
          <p className="text-sm text-muted-foreground">{t('Parties.Metadata.Subtitle')}</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleAdd}>
          <Plus className="mr-1 h-4 w-4" />
          {t('Parties.Metadata.AddEntry')}
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('Parties.Metadata.Empty')}</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div key={entry.id} className="flex items-center gap-2">
              <Input
                value={entry.key}
                onChange={(e) => handleChange(index, { key: e.target.value })}
                placeholder={t('Parties.Fields.MetadataKey')}
                aria-label={t('Parties.Fields.MetadataKey')}
                maxLength={metadataLimits.keyMax}
                className="max-w-xs"
              />
              <Input
                value={entry.value}
                onChange={(e) => handleChange(index, { value: e.target.value })}
                placeholder={t('Parties.Fields.MetadataValue')}
                aria-label={t('Parties.Fields.MetadataValue')}
                maxLength={metadataLimits.valueMax}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(index)}
                aria-label={t('Common.Delete')}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? t('Common.Loading') : t('Common.Save')}
        </Button>
      </div>
    </div>
  );
}
