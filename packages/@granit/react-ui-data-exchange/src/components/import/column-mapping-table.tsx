import { useTranslation } from '@granit/react-localization';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@granit/react-ui';

import { MappingConfidenceBadge } from './mapping-confidence-badge';

import type {
  ImportColumnMapping as ColumnMapping,
  ImportFieldMetadata as FieldMetadata,
} from '@granit/data-exchange';

export interface ColumnMappingTableProps {
  /** Current column mappings. */
  readonly mappings: readonly ColumnMapping[];
  /** Available target fields. */
  readonly fieldMetadata: readonly FieldMetadata[];
  /** Preview rows (first few rows from the file). */
  readonly previewRows: readonly (readonly string[])[];
  /** Headers from the file. */
  readonly headers: readonly string[];
  /** Callback when a mapping changes. */
  readonly onMappingChange: (sourceColumn: string, targetProperty: string | null) => void;
  /** Whether the table is disabled. */
  readonly disabled?: boolean;
}

const UNMAPPED_VALUE = '__unmapped__';

/**
 * Interactive table for mapping source columns to target properties.
 */
export function ColumnMappingTable({
  mappings,
  fieldMetadata,
  previewRows,
  headers,
  onMappingChange,
  disabled = false,
}: ColumnMappingTableProps) {
  const { t } = useTranslation();
  const assignedTargets = new Set(
    mappings.filter((m) => m.targetProperty).map((m) => m.targetProperty)
  );

  return (
    <div data-slot="column-mapping-table" className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('DataExchange.Import.SourceColumn')}</TableHead>
            <TableHead>{t('DataExchange.Import.Preview')}</TableHead>
            <TableHead>{t('DataExchange.Import.TargetProperty')}</TableHead>
            <TableHead>{t('DataExchange.Import.Confidence')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mappings.map((mapping) => {
            const colIndex = headers.indexOf(mapping.sourceColumn);
            const sampleValue = previewRows[0]?.[colIndex] ?? '';

            return (
              <TableRow key={mapping.sourceColumn}>
                <TableCell className="font-medium">{mapping.sourceColumn}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {sampleValue || '\u2014'}
                </TableCell>
                <TableCell>
                  <Select
                    value={mapping.targetProperty ?? UNMAPPED_VALUE}
                    onValueChange={(value) =>
                      onMappingChange(mapping.sourceColumn, value === UNMAPPED_VALUE ? null : value)
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder={t('DataExchange.Import.NotMapped')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNMAPPED_VALUE}>
                        <span className="text-muted-foreground">
                          {t('DataExchange.Import.NotMapped')}
                        </span>
                      </SelectItem>
                      {fieldMetadata.map((field) => {
                        const isAssigned =
                          assignedTargets.has(field.propertyPath) &&
                          mapping.targetProperty !== field.propertyPath;
                        return (
                          <SelectItem
                            key={field.propertyPath}
                            value={field.propertyPath}
                            disabled={isAssigned}
                          >
                            {field.displayName}
                            {field.isRequired && <span className="ml-1 text-destructive">*</span>}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <MappingConfidenceBadge confidence={mapping.confidence} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
