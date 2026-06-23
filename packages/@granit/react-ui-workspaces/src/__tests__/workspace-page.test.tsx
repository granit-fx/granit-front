import { render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { workspacesTranslationsEn } from '../locales';
import { WorkspacePage } from '../workspace-page';

const mockUseWorkspaces = vi.fn();
vi.mock('@granit/react-workspaces', () => ({
  useWorkspaces: () => mockUseWorkspaces() as unknown,
}));

const testI18n = i18next.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...workspacesTranslationsEn } } },
  interpolation: { escapeValue: false },
});

const renderIcon = (name: string | null) => <span data-testid="icon">{name}</span>;

function renderPage(workspaceName: string | undefined) {
  return render(
    <I18nextProvider i18n={testI18n}>
      <WorkspacePage workspaceName={workspaceName} renderIcon={renderIcon} />
    </I18nextProvider>
  );
}

describe('WorkspacePage', () => {
  it('renders skeletons while the workspace tree loads', () => {
    mockUseWorkspaces.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderPage('Showcase.CRM');
    expect(container.querySelector('.rounded-2xl')).not.toBeNull();
    expect(screen.queryByTestId('icon')).toBeNull();
  });

  it('renders the not-found state for an unknown workspace', () => {
    mockUseWorkspaces.mockReturnValue({ data: { workspaces: [] }, isLoading: false });
    renderPage('Nope');
    expect(screen.getByText('Workspace not found')).toBeInTheDocument();
  });

  it('renders the title (resolved from displayKey) and the injected icon when found', () => {
    mockUseWorkspaces.mockReturnValue({
      data: {
        workspaces: [
          {
            name: 'Showcase.CRM',
            displayKey: 'Showcase:Workspace.CRM',
            icon: 'contact',
            isShell: false,
          },
        ],
      },
      isLoading: false,
    });
    renderPage('Showcase.CRM');
    // resolveLabel falls back to the key's last segment with no translation.
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('CRM');
    expect(screen.getByTestId('icon')).toHaveTextContent('contact');
  });
});
