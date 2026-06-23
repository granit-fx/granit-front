import { mockWorkspaces } from '@granit/react-ai/testing';
import { screen } from '@testing-library/react';

import { WorkspaceDetail } from '../components/workspace-detail';

import { renderWithProviders } from './test-utils';

import type { AIWorkspaceResponse } from '@granit/ai';

describe('WorkspaceDetail', () => {
  it('renders provider, model and configuration values', () => {
    const ws = mockWorkspaces[0]!;
    renderWithProviders(<WorkspaceDetail workspace={ws} />);

    expect(screen.getByText(ws.provider)).toBeInTheDocument();
    expect(screen.getByText(ws.model)).toBeInTheDocument();
    expect(screen.getByText(ws.systemPrompt!)).toBeInTheDocument();
    expect(screen.getByText(String(ws.temperature))).toBeInTheDocument();
    expect(screen.getByText(String(ws.maxOutputTokens))).toBeInTheDocument();
  });

  it('renders the read-only system hint', () => {
    renderWithProviders(<WorkspaceDetail workspace={mockWorkspaces[0]!} />);
    expect(
      screen.getByText('System workspaces are read-only and cannot be modified or deleted.')
    ).toBeInTheDocument();
  });

  it('shows the display name when present', () => {
    const ws = mockWorkspaces[0]!;
    renderWithProviders(<WorkspaceDetail workspace={ws} />);
    expect(screen.getByText(ws.displayName!)).toBeInTheDocument();
  });

  it('falls back to a dash for missing optional values', () => {
    const ws: AIWorkspaceResponse = {
      ...mockWorkspaces[0]!,
      displayName: null,
      systemPrompt: null,
      temperature: null,
      maxOutputTokens: null,
    };
    renderWithProviders(<WorkspaceDetail workspace={ws} />);
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText('System Prompt')).not.toBeInTheDocument();
  });
});
