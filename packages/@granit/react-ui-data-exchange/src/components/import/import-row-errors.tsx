import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';

import type { ImportRowError, ImportRowErrorKind } from '@granit/data-exchange';

export interface ImportRowErrorsProps {
  readonly errors: readonly ImportRowError[];
  /** Maximum number of errors to display. Defaults to 50. */
  readonly maxDisplay?: number;
}

const KIND_VARIANTS: Record<
  ImportRowErrorKind,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  Conversion: 'secondary',
  Validation: 'destructive',
  Persistence: 'destructive',
  Identity: 'outline',
};

/**
 * Table displaying individual row errors from an import report.
 */
export function ImportRowErrors({ errors, maxDisplay = 50 }: ImportRowErrorsProps) {
  const displayed = errors.slice(0, maxDisplay);
  const remaining = errors.length - displayed.length;

  if (errors.length === 0) return null;

  return (
    <div data-slot="import-row-errors" className="space-y-2">
      <p className="text-sm font-medium">Row errors ({errors.length})</p>
      <div className="max-h-60 overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Row</TableHead>
              <TableHead className="w-28">Kind</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.map((error, index) => (
              <TableRow key={`${error.rowNumber}-${index}`}>
                <TableCell className="font-mono text-sm">{error.rowNumber}</TableCell>
                <TableCell>
                  <Badge variant={KIND_VARIANTS[error.kind]} className="text-xs">
                    {error.kind}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{error.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {remaining > 0 && (
        <p className="text-xs text-muted-foreground">
          {remaining} more errors not shown. Download the correction file for full details.
        </p>
      )}
    </div>
  );
}
