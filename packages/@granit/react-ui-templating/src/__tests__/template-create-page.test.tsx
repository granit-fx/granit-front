import { screen } from '@testing-library/react';
import * as React from 'react';

import { TemplateCreatePage } from '../components/template-create-page';

import { renderWithProviders } from './test-utils';

vi.mock('@granit/react-templating', () => ({
  TemplatingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTemplateMutations: () => ({
    saveDraft: { mutateAsync: vi.fn(), isPending: false },
    publish: { mutateAsync: vi.fn(), isPending: false },
    archive: { mutateAsync: vi.fn(), isPending: false },
  }),
  useTemplateCategories: () => ({ data: [], isLoading: false }),
  useTemplateLayouts: () => ({ data: [], isLoading: false }),
}));

describe('TemplateCreatePage', () => {
  it('should render page heading', () => {
    renderWithProviders(<TemplateCreatePage />);
    expect(screen.getByText('New template')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderWithProviders(<TemplateCreatePage />);
    expect(document.querySelector('[data-slot="template-create-page"]')).toBeInTheDocument();
  });

  it('should render back link to templates list', () => {
    renderWithProviders(<TemplateCreatePage />);
    expect(screen.getByText('Template Management')).toBeInTheDocument();
  });
});
