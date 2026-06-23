import { screen } from '@testing-library/react';

import { TemplateStatusBadge } from '../components/template-status-badge';

import { renderWithProviders } from './test-utils';

describe('TemplateStatusBadge', () => {
  it('should render draft status', () => {
    renderWithProviders(<TemplateStatusBadge status="Draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('should render published status', () => {
    renderWithProviders(<TemplateStatusBadge status="Published" />);
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('should render archived status', () => {
    renderWithProviders(<TemplateStatusBadge status="Archived" />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('should render pending review status', () => {
    renderWithProviders(<TemplateStatusBadge status="PendingReview" />);
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderWithProviders(<TemplateStatusBadge status="Draft" />);
    expect(
      screen.getByText('Draft').closest('[data-slot="template-status-badge"]')
    ).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    renderWithProviders(<TemplateStatusBadge status="Draft" className="my-class" />);
    expect(screen.getByText('Draft')).toHaveClass('my-class');
  });
});
