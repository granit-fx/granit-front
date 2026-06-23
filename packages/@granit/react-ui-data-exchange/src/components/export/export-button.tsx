import { Button } from '@granit/react-ui';
import { Download } from 'lucide-react';

import type { ComponentProps } from 'react';

export interface ExportButtonProps extends Omit<ComponentProps<typeof Button>, 'onClick'> {
  /** Label text. Defaults to "Export". */
  readonly label?: string;
  /** Called when the button is clicked. */
  readonly onExport: () => void;
}

/**
 * Toolbar button that triggers an export action.
 *
 * Typically opens an `ExportDialog` when clicked.
 */
export function ExportButton({
  label = 'Export',
  onExport,
  variant = 'outline',
  size = 'sm',
  ...props
}: ExportButtonProps) {
  return (
    <Button data-slot="export-button" variant={variant} size={size} onClick={onExport} {...props}>
      <Download className="mr-2 h-4 w-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
