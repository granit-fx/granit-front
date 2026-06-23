import { screen } from '@testing-library/react';
import * as React from 'react';

import { TemplateEditPage } from '../template-edit-page';

import { renderWithProviders } from './test-utils';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: () => ({ name: 'welcome-email' }), useNavigate: () => vi.fn() };
});

vi.mock('@granit/react-templating', () => ({
  TemplatingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTemplate: () => ({
    data: {
      name: 'welcome-email',
      culture: null,
      content: '<h1>Welcome</h1>',
      mimeType: 'text/html',
      category: null,
      status: 0,
      currentRevision: 1,
      layoutName: null,
    },
    isLoading: false,
  }),
  useTemplateMutations: () => ({
    saveDraft: { mutateAsync: vi.fn(), isPending: false },
    updateDraft: { mutateAsync: vi.fn(), isPending: false },
    publish: { mutateAsync: vi.fn(), isPending: false },
    archive: { mutateAsync: vi.fn(), isPending: false },
    restore: { mutateAsync: vi.fn(), isPending: false },
  }),
  useTemplateRevisions: () => ({ data: [], isLoading: false }),
  useTemplateRevision: () => ({ data: null, isLoading: false }),
  useTemplateCategories: () => ({ data: [], isLoading: false }),
  useTemplateCategoryMutations: () => ({
    create: { mutateAsync: vi.fn(), isPending: false },
    remove: { mutateAsync: vi.fn(), isPending: false },
  }),
  useTemplateLayouts: () => ({ data: [], isLoading: false }),
  useTemplateHistory: () => ({ data: [], isLoading: false }),
  useTemplateVariables: () => ({ data: [], isLoading: false }),
}));

describe('TemplateEditPage', () => {
  it('should render template name as heading', () => {
    renderWithProviders(<TemplateEditPage />);
    expect(screen.getByText('welcome-email')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderWithProviders(<TemplateEditPage />);
    expect(document.querySelector('[data-slot="template-edit-page"]')).toBeInTheDocument();
  });
});
