import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { JobStatusBadge } from '../components/job-status-badge';

import { renderDataExchange } from './test-utils';

import type { ExportJobStatus, ImportJobStatus } from '@granit/data-exchange';

describe('JobStatusBadge', () => {
  it.each<[ImportJobStatus | ExportJobStatus, string]>([
    ['Completed', 'Completed'],
    ['PartiallyCompleted', 'Partial'],
    ['Failed', 'Failed'],
    ['Cancelled', 'Cancelled'],
    ['Queued', 'Queued'],
    ['Exporting', 'Exporting'],
    ['Created', 'Created'],
  ])('should render a badge for the %s status', (status, label) => {
    renderDataExchange(<JobStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('should expose the data-slot attribute', () => {
    renderDataExchange(<JobStatusBadge status="Completed" />);
    expect(document.querySelector('[data-slot="job-status-badge"]')).toBeInTheDocument();
  });
});
