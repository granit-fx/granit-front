import { toast } from '@granit/react-ui';
import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatSettingsPage } from '../components/chat-settings-page';

import { renderWithProviders } from './test-utils';

const updateAsync = vi.fn();

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@granit/react-settings', () => ({
  useSettings: () => ({ isLoading: false, data: {}, dataUpdatedAt: 1 }),
  useUpdateSetting: () => ({ updateAsync, isPending: false }),
}));

vi.mock('@granit/react-ai-chat', () => ({
  useChatWorkspaces: () => ({ data: { workspaces: ['Auto', 'support'] } }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('ChatSettingsPage', () => {
  it('renders translated labels instead of hardcoded strings', () => {
    renderWithProviders(<ChatSettingsPage />);

    expect(screen.getByRole('heading', { name: 'Chat preferences' })).toBeInTheDocument();
    expect(screen.getByText('Default workspace')).toBeInTheDocument();
    expect(screen.getByText('Web search')).toBeInTheDocument();
    expect(screen.getByText('Custom context')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('persists every preference and confirms with a toast on success', async () => {
    updateAsync.mockResolvedValue(undefined);
    const { user } = renderWithProviders(<ChatSettingsPage />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(updateAsync).toHaveBeenCalledTimes(3));
    expect(updateAsync).toHaveBeenCalledWith('Granit.AI.Chat.DefaultWorkspace', 'Auto');
    expect(updateAsync).toHaveBeenCalledWith('Granit.AI.Chat.WebSearchPolicy', 'Deny');
    expect(updateAsync).toHaveBeenCalledWith('Granit.AI.Chat.CustomContext', '');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Preferences saved'));
  });

  it('surfaces a failed save with an error toast instead of swallowing it', async () => {
    updateAsync.mockRejectedValue(new Error('boom'));
    const { user } = renderWithProviders(<ChatSettingsPage />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Couldn't save your preferences"));
  });
});
