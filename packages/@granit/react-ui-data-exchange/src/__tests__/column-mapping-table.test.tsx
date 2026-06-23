import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ColumnMappingTable } from '../components/import/column-mapping-table';

import { renderDataExchange } from './test-utils';

import type { ImportColumnMapping, ImportFieldMetadata } from '@granit/data-exchange';

const fieldMetadata: ImportFieldMetadata[] = [
  {
    propertyPath: 'name',
    clrTypeName: 'String',
    displayName: 'Name',
    description: null,
    isRequired: true,
  },
  {
    propertyPath: 'email',
    clrTypeName: 'String',
    displayName: 'Email',
    description: null,
    isRequired: false,
  },
];

const mappings: ImportColumnMapping[] = [
  { sourceColumn: 'Full Name', targetProperty: 'name', confidence: 'Exact' },
  { sourceColumn: 'Mail', targetProperty: null, confidence: 'Manual' },
];

const headers = ['Full Name', 'Mail'];
const previewRows = [['Alice', 'alice@example.com']];

describe('ColumnMappingTable', () => {
  it('should render the table with rows for each mapping', () => {
    renderDataExchange(
      <ColumnMappingTable
        mappings={mappings}
        fieldMetadata={fieldMetadata}
        previewRows={previewRows}
        headers={headers}
        onMappingChange={vi.fn()}
      />
    );
    expect(document.querySelector('[data-slot="column-mapping-table"]')).toBeInTheDocument();
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Mail')).toBeInTheDocument();
    // Sample value for the first mapped column.
    expect(screen.getByText('Alice')).toBeInTheDocument();
    // Confidence badges rendered per row.
    expect(screen.getByText('Exact match')).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument();
  });

  it('should render an em-dash when the preview cell is empty', () => {
    renderDataExchange(
      <ColumnMappingTable
        mappings={[{ sourceColumn: 'Unknown', targetProperty: null, confidence: 'Manual' }]}
        fieldMetadata={fieldMetadata}
        previewRows={[]}
        headers={['Unknown']}
        onMappingChange={vi.fn()}
      />
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should render when disabled', () => {
    renderDataExchange(
      <ColumnMappingTable
        mappings={mappings}
        fieldMetadata={fieldMetadata}
        previewRows={previewRows}
        headers={headers}
        onMappingChange={vi.fn()}
        disabled
      />
    );
    expect(document.querySelector('[data-slot="column-mapping-table"]')).toBeInTheDocument();
  });
});
