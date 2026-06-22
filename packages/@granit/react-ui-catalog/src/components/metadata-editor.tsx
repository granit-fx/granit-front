import { useUpdateProductMetadata } from '@granit/react-catalog';
import { useTranslation } from '@granit/react-localization';
import { Button, Input } from '@granit/react-ui';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import type { ProductResponse } from '@granit/catalog';

interface Props {
  readonly product: ProductResponse;
}

interface Entry {
  id: string;
  key: string;
  value: string;
}

function newEntryId(): string {
  return crypto.randomUUID();
}

function entriesFromMetadata(metadata: Readonly<Record<string, string>>): Entry[] {
  return Object.entries(metadata).map(([key, value]) => ({ id: newEntryId(), key, value }));
}

function metadataFromEntries(entries: readonly Entry[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const { key, value } of entries) {
    const trimmed = key.trim();
    if (trimmed) result[trimmed] = value;
  }
  return result;
}

export function MetadataEditor({ product }: Props) {
  const { t } = useTranslation();
  const update = useUpdateProductMetadata();
  const [entries, setEntries] = useState<Entry[]>(() => entriesFromMetadata(product.metadata));
  const [dirty, setDirty] = useState(false);

  // Reset when the server returns a new metadata object (after save). React-idiomatic
  // pattern: store the last-seen prop and resync during render — avoids the useEffect
  // setState antipattern. https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [lastSeenMetadata, setLastSeenMetadata] = useState(product.metadata);
  if (lastSeenMetadata !== product.metadata) {
    setLastSeenMetadata(product.metadata);
    setEntries(entriesFromMetadata(product.metadata));
    setDirty(false);
  }

  const addEntry = () => {
    setEntries([...entries, { id: newEntryId(), key: '', value: '' }]);
    setDirty(true);
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter((entry) => entry.id !== id));
    setDirty(true);
  };

  const updateEntry = (id: string, field: 'key' | 'value', value: string) => {
    setEntries(entries.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)));
    setDirty(true);
  };

  const handleSave = () => {
    update.mutate(
      {
        id: product.id,
        request: { metadata: metadataFromEntries(entries) },
      },
      {
        onSuccess: () => toast.success(t('Catalog.MetadataSaveSuccess')),
      }
    );
  };

  return (
    <div className="space-y-3">
      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('Catalog.NoMetadata')}</p>
      )}
      {entries.map((entry) => (
        <div key={entry.id} className="flex gap-2">
          <Input
            value={entry.key}
            onChange={(event) => updateEntry(entry.id, 'key', event.target.value)}
            placeholder={t('Catalog.MetadataKeyPlaceholder')}
            className="flex-1"
          />
          <Input
            value={entry.value}
            onChange={(event) => updateEntry(entry.id, 'value', event.target.value)}
            placeholder={t('Catalog.MetadataValuePlaceholder')}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeEntry(entry.id)}
            aria-label={t('Catalog.Actions.RemoveMetadata')}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={addEntry}>
          <Plus className="size-4" />
          {t('Catalog.Actions.AddMetadata')}
        </Button>
        <Button type="button" onClick={handleSave} disabled={!dirty || update.isPending}>
          {update.isPending && <Loader2 className="size-4 animate-spin" />}
          {t('Catalog.Actions.SaveMetadata')}
        </Button>
      </div>
    </div>
  );
}
