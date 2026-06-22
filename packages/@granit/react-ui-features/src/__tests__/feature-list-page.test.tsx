import { screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { FeatureListPage } from '../feature-list-page';

import { renderFeatures } from './test-utils';

// ---------------------------------------------------------------------------
// Mocks — the page wraps the headless FeaturesProvider (stubbed to a passthrough)
// and consumes the @granit/react-features hooks. useGranitClient still resolves
// from the real GranitClientProvider supplied by the render helper.
// ---------------------------------------------------------------------------

vi.mock('@granit/react-features', () => ({
  FeaturesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useFeatureDefinitions: () => ({ data: [], isLoading: false }),
  useFeatureValues: () => ({ data: {}, isLoading: false }),
}));

describe('FeatureListPage', () => {
  it('renders the page title', () => {
    renderFeatures(<FeatureListPage />);
    expect(screen.getByText('Feature Flags')).toBeInTheDocument();
  });

  it('renders the page description', () => {
    renderFeatures(<FeatureListPage />);
    expect(screen.getByText('Manage feature flags and overrides')).toBeInTheDocument();
  });

  it('shows empty state when no feature groups', () => {
    renderFeatures(<FeatureListPage />);
    expect(screen.getByText('No feature flags found')).toBeInTheDocument();
  });

  it('has the correct data-slot', () => {
    renderFeatures(<FeatureListPage />);
    expect(document.querySelector('[data-slot="feature-list-page"]')).toBeInTheDocument();
  });
});
