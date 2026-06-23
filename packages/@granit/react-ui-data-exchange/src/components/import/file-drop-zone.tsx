import { useTranslation } from '@granit/react-localization';
import { cn } from '@granit/utils';
import { Upload } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import type { DragEvent } from 'react';

export interface FileDropZoneProps {
  /** Accepted file extensions (e.g. `['.csv', '.xlsx']`). */
  readonly accept?: readonly string[];
  /** Whether the zone is disabled. */
  readonly disabled?: boolean;
  /** Callback when a file is selected. */
  readonly onFileSelect: (file: File) => void;
  /** Custom class name. */
  readonly className?: string;
}

/**
 * Drag-and-drop file upload zone with click-to-browse fallback.
 */
export function FileDropZone({
  accept,
  disabled = false,
  onFileSelect,
  className,
}: FileDropZoneProps) {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [disabled, onFileSelect]
  );

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
      e.target.value = '';
    },
    [onFileSelect]
  );

  return (
    <button
      type="button"
      data-slot="file-drop-zone"
      tabIndex={disabled ? -1 : 0}
      disabled={disabled}
      className={cn(
        'flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-transparent p-8 text-center transition-colors',
        isDragOver && 'border-primary bg-primary/5',
        !isDragOver && 'border-muted-foreground/25',
        disabled && 'cursor-not-allowed opacity-50',
        !disabled && 'cursor-pointer hover:border-primary/50',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <Upload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        {t('Components.DataExchange.Import.DropZone')}
      </p>
      {accept && (
        <p className="text-xs text-muted-foreground/70">
          {t('Components.DataExchange.Import.Accepted', { formats: accept.join(', ') })}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept?.join(',')}
        onChange={handleInputChange}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
      />
    </button>
  );
}
