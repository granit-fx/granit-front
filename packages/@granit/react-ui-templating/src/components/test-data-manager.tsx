import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@granit/react-ui';
import { Save, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { useTestDataStore } from '../hooks/use-test-data-store';

interface TestDataManagerProps {
  templateName: string;
  currentData: string;
  onLoad: (data: string) => void;
}

export function TestDataManager({
  templateName,
  currentData,
  onLoad,
}: Readonly<TestDataManagerProps>) {
  const { t } = useTranslation();
  const { datasets, save, remove, load } = useTestDataStore(templateName);
  const [saveName, setSaveName] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    if (!saveName.trim()) return;
    save(saveName.trim(), currentData);
    setSaveName('');
    setIsOpen(false);
  };

  const handleLoad = (id: string) => {
    const data = load(id);
    if (data) onLoad(data);
  };

  return (
    <div data-slot="test-data-manager" className="flex items-center gap-2">
      <Select onValueChange={handleLoad}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t('Templates.Editor.TestData')} />
        </SelectTrigger>
        <SelectContent>
          {datasets.map((d) => (
            <div key={d.id} className="flex items-center justify-between">
              <SelectItem value={d.id}>{d.name}</SelectItem>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(d.id);
                }}
                aria-label={t('Common.Delete')}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {datasets.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">{t('Common.NoResults')}</p>
          )}
        </SelectContent>
      </Select>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Save className="mr-2 h-3 w-3" />
            {t('Common.Save')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-2">
          <Input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder={t('Templates.Editor.TestData')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
          />
          <Button size="sm" onClick={handleSave} className="w-full">
            {t('Common.Confirm')}
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
