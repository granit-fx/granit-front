import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ImportRowErrors } from '../components/import/import-row-errors';

import { renderDataExchange } from './test-utils';

import type { ImportRowError } from '@granit/data-exchange';

function makeError(rowNumber: number, kind: ImportRowError['kind']): ImportRowError {
  return { rowNumber, kind, errorCodes: ['E1'], message: `Error on row ${rowNumber}` };
}

describe('ImportRowErrors', () => {
  it('should render nothing when there are no errors', () => {
    const { container } = renderDataExchange(<ImportRowErrors errors={[]} />);
    expect(container.querySelector('[data-slot="import-row-errors"]')).not.toBeInTheDocument();
  });

  it('should render each error row with its kind badge', () => {
    const errors: ImportRowError[] = [
      makeError(1, 'Conversion'),
      makeError(2, 'Validation'),
      makeError(3, 'Persistence'),
      makeError(4, 'Identity'),
    ];
    renderDataExchange(<ImportRowErrors errors={errors} />);
    expect(screen.getByText('Row errors (4)')).toBeInTheDocument();
    expect(screen.getByText('Conversion')).toBeInTheDocument();
    expect(screen.getByText('Validation')).toBeInTheDocument();
    expect(screen.getByText('Persistence')).toBeInTheDocument();
    expect(screen.getByText('Identity')).toBeInTheDocument();
    expect(screen.getByText('Error on row 1')).toBeInTheDocument();
  });

  it('should truncate to maxDisplay and report the remaining count', () => {
    const errors: ImportRowError[] = Array.from({ length: 5 }, (_, i) =>
      makeError(i + 1, 'Validation')
    );
    renderDataExchange(<ImportRowErrors errors={errors} maxDisplay={2} />);
    expect(screen.getByText('Row errors (5)')).toBeInTheDocument();
    expect(
      screen.getByText(/3 more errors not shown\. Download the correction file for full details\./)
    ).toBeInTheDocument();
  });
});
