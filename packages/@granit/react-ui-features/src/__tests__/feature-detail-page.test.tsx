import { screen } from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FeatureDetailPage } from '../feature-detail-page';

import { renderFeatures } from './test-utils';

const { mockUseParams } = vi.hoisted(() => ({
  mockUseParams: vi.fn(),
}));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useParams: mockUseParams,
    useNavigate: () => vi.fn(),
  };
});

const { mockUseFeatureDefinitions, mockUseFeatureValue } = vi.hoisted(() => ({
  mockUseFeatureDefinitions: vi.fn(),
  mockUseFeatureValue: vi.fn(),
}));

vi.mock('@granit/react-features', () => ({
  FeaturesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useFeatureDefinitions: mockUseFeatureDefinitions,
  useFeatureValue: mockUseFeatureValue,
  useSetFeatureOverride: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteFeatureOverride: () => ({ mutate: vi.fn(), isPending: false }),
}));

const definition = {
  name: 'ui.dark-mode',
  defaultValue: 'false',
  valueType: 'Toggle' as const,
  numericConstraint: null,
  selectionValues: null,
  displayName: 'Dark mode',
  description: 'Enable the dark theme across the app.',
};

const groups = [{ name: 'ui', displayName: 'UI', features: [definition] }];

const featureValue = { name: 'ui.dark-mode', value: 'true' };

beforeEach(() => {
  mockUseParams.mockReturnValue({ name: 'ui.dark-mode' });
});

afterEach(() => vi.clearAllMocks());

describe('FeatureDetailPage', () => {
  it('should display the loading spinner', () => {
    mockUseFeatureDefinitions.mockReturnValue({ data: undefined, isLoading: true });
    mockUseFeatureValue.mockReturnValue({ data: undefined, isLoading: true });
    renderFeatures(<FeatureDetailPage />, { route: '/features/ui.dark-mode' });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display the not-found state when the definition is missing', () => {
    mockUseFeatureDefinitions.mockReturnValue({ data: [], isLoading: false });
    mockUseFeatureValue.mockReturnValue({ data: featureValue, isLoading: false });
    renderFeatures(<FeatureDetailPage />, { route: '/features/ui.dark-mode' });
    expect(screen.getByText('Feature not found')).toBeInTheDocument();
    expect(screen.getByText('Back to list')).toBeInTheDocument();
  });

  it('should display the not-found state when the value is missing', () => {
    mockUseFeatureDefinitions.mockReturnValue({ data: groups, isLoading: false });
    mockUseFeatureValue.mockReturnValue({ data: undefined, isLoading: false });
    renderFeatures(<FeatureDetailPage />, { route: '/features/ui.dark-mode' });
    expect(screen.getByText('Feature not found')).toBeInTheDocument();
  });

  it('should render the feature name and description', () => {
    mockUseFeatureDefinitions.mockReturnValue({ data: groups, isLoading: false });
    mockUseFeatureValue.mockReturnValue({ data: featureValue, isLoading: false });
    renderFeatures(<FeatureDetailPage />, { route: '/features/ui.dark-mode' });
    expect(screen.getByRole('heading', { level: 2, name: 'Dark mode' })).toBeInTheDocument();
    expect(screen.getByText('Enable the dark theme across the app.')).toBeInTheDocument();
  });

  it('should expose the page data-slot and render the definition cards', () => {
    mockUseFeatureDefinitions.mockReturnValue({ data: groups, isLoading: false });
    mockUseFeatureValue.mockReturnValue({ data: featureValue, isLoading: false });
    renderFeatures(<FeatureDetailPage />, { route: '/features/ui.dark-mode' });
    expect(document.querySelector('[data-slot="feature-detail-page"]')).toBeInTheDocument();
    expect(screen.getByText('Definition')).toBeInTheDocument();
    expect(screen.getByText('Current State')).toBeInTheDocument();
    expect(screen.getByText('ui.dark-mode')).toBeInTheDocument();
  });
});
