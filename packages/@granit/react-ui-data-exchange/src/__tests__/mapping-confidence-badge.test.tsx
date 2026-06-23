import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MappingConfidenceBadge } from '../components/import/mapping-confidence-badge';

import { renderDataExchange } from './test-utils';

import type { MappingConfidence } from '@granit/data-exchange';

describe('MappingConfidenceBadge', () => {
  it.each<[MappingConfidence, string]>([
    ['Manual', 'Manual'],
    ['Saved', 'Saved'],
    ['Exact', 'Exact match'],
    ['Fuzzy', 'Fuzzy match'],
    ['Semantic', 'Semantic'],
  ])('should render the %s confidence label', (confidence, label) => {
    renderDataExchange(<MappingConfidenceBadge confidence={confidence} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('should expose the data-slot attribute', () => {
    renderDataExchange(<MappingConfidenceBadge confidence="Exact" />);
    expect(document.querySelector('[data-slot="mapping-confidence-badge"]')).toBeInTheDocument();
  });
});
