import { Button } from '@granit/react-ui';
import { Upload } from 'lucide-react';

import type { ComponentProps } from 'react';

export interface ImportButtonProps extends Omit<ComponentProps<typeof Button>, 'onClick'> {
  /** Label text. Defaults to "Import". */
  readonly label?: string;
  /** Called when the button is clicked. */
  readonly onImport: () => void;
}

/**
 * Toolbar button that triggers an import action.
 *
 * Typically opens an `ImportDialog` when clicked.
 */
export function ImportButton({
  label = 'Import',
  onImport,
  variant = 'outline',
  size = 'sm',
  ...props
}: ImportButtonProps) {
  return (
    <Button data-slot="import-button" variant={variant} size={size} onClick={onImport} {...props}>
      <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
