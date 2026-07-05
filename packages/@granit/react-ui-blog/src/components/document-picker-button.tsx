import { DocumentSearchPalette } from '@granit/react-documents';
import { Button } from '@granit/react-ui';
import { X } from 'lucide-react';
import { useState } from 'react';

export interface DocumentPickerButtonProps {
  readonly value: string | null;
  readonly onChange: (documentId: string | null) => void;
  readonly pickLabel: string;
  readonly clearLabel: string;
  readonly disabled?: boolean;
}

/**
 * A thin picker that opens the shared `DocumentSearchPalette` and stores the
 * chosen Document id. Used for cover images, avatars and gallery attachments.
 * Requires a `DocumentsProvider` in the tree.
 */
export function DocumentPickerButton({
  value,
  onChange,
  pickLabel,
  clearLabel,
  disabled,
}: DocumentPickerButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-2" data-slot="document-picker">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {pickLabel}
      </Button>
      {value ? (
        <>
          <span className="font-mono text-xs text-muted-foreground" data-slot="document-id">
            {value}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={clearLabel}
            onClick={() => onChange(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : null}
      <DocumentSearchPalette
        open={open}
        onClose={() => setOpen(false)}
        onPickDocument={(id) => {
          onChange(id);
          setOpen(false);
        }}
      />
    </div>
  );
}
