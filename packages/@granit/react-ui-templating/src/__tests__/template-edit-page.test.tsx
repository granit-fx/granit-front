import { screen } from '@testing-library/react';
import * as React from 'react';

import { TemplateEditPage } from '../components/template-edit-page';

import { renderWithProviders } from './test-utils';

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual, useParams: () => ({ name: 'Email.Welcome' }), useNavigate: () => vi.fn() };
});

vi.mock('@granit/react-templating', async () => {
  const { mockTemplatesData, toTemplateDetail } = await import('@granit/react-templating/testing');
  // Null out the optional fields so the page exercises every nullish fallback
  // (culture -> CultureNeutral, content -> '', status -> 'Draft') while keeping
  // the shared template name.
  const detail = {
    ...toTemplateDetail(mockTemplatesData[0]!),
    culture: null,
    layoutName: null,
    draft: null,
    published: null,
  };
  return {
    TemplatingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useTemplate: () => ({ data: detail, isLoading: false }),
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
  };
});

describe('TemplateEditPage', () => {
  it('should render template name as heading', () => {
    renderWithProviders(<TemplateEditPage />);
    expect(screen.getByText('Email.Welcome')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderWithProviders(<TemplateEditPage />);
    expect(document.querySelector('[data-slot="template-edit-page"]')).toBeInTheDocument();
  });
});
