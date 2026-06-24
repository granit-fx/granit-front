import { screen } from '@testing-library/react';

import { PrivacyRegulationPage } from '../components/privacy-regulation-page';

import { renderWithProviders } from './test-utils';

const regulation = {
  regulation: 'GDPR',
  displayName: 'General Data Protection Regulation',
  jurisdictionCode: 'EU',
  contributingRegulations: ['GDPR'],
  consentModel: 'OptIn',
  availableLegalBases: ['Consent', 'Contract'],
  subjectAccessRequestDays: 30,
  subjectAccessRequestExtensionDays: 60,
  deletionRequestDays: 30,
  defaultDeletionGracePeriodDays: 30,
  maxDeletionGracePeriodDays: 90,
  breachNotifyAuthorityHours: 72,
  breachNotifyIndividualsHours: null,
  minimumConsentAge: 16,
  requiresParentalIdentityVerification: false,
  cookieConsentModel: 'OptIn',
  honorGlobalPrivacyControl: true,
  requiresCrossBorderAssessment: false,
  transferMechanisms: [],
  dataLocalizationRequired: false,
  requiresDpoOrRepresentative: true,
  requiredExportFormats: ['JSON'],
};

const purposes = [
  {
    purposeId: 'analytics',
    displayName: 'Analytics',
    description: 'Usage analytics',
    legalBasis: 'Consent',
    requiresExplicitConsent: true,
    dataCategory: 'Behavioural',
  },
];

const hookState = {
  regulation: { data: regulation, isLoading: false } as Record<string, unknown>,
  purposes: { data: purposes, isLoading: false } as Record<string, unknown>,
};

vi.mock('@granit/react-privacy', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useApplicableRegulation: () => hookState.regulation,
    useProcessingPurposes: () => hookState.purposes,
  };
});

describe('PrivacyRegulationPage', () => {
  beforeEach(() => {
    hookState.regulation = { data: regulation, isLoading: false };
    hookState.purposes = { data: purposes, isLoading: false };
  });

  it('should render the page title and have data-slot attribute', () => {
    renderWithProviders(<PrivacyRegulationPage />);
    expect(screen.getByText('Privacy Regulation')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="privacy-regulation-page"]')).toBeInTheDocument();
  });

  it('should render the regulation profile fields', () => {
    renderWithProviders(<PrivacyRegulationPage />);
    expect(screen.getByText('Regulation Profile')).toBeInTheDocument();
    expect(screen.getByText('GDPR')).toBeInTheDocument();
    expect(screen.getByText('General Data Protection Regulation')).toBeInTheDocument();
    expect(screen.getByText('EU')).toBeInTheDocument();
  });

  it('should render processing purposes content', () => {
    renderWithProviders(<PrivacyRegulationPage />);
    expect(screen.getByText('Processing Purposes')).toBeInTheDocument();
    expect(screen.getByText('analytics')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('should render the empty state when there are no purposes', () => {
    hookState.purposes = { data: [], isLoading: false };
    renderWithProviders(<PrivacyRegulationPage />);
    expect(screen.getByText('No processing purposes declared.')).toBeInTheDocument();
  });
});
