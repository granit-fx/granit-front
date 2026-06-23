import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConversationListItem } from '../components/conversation-list-item';

import { renderWithProviders } from './test-utils';

const baseProps = { id: 'c1', title: 'My chat', isActive: false, isPinned: false };
const noop = () => {};

describe('ConversationListItem', () => {
  it('opens the conversation when its title is clicked', async () => {
    const onSelect = vi.fn();
    const { user } = renderWithProviders(
      <ConversationListItem
        {...baseProps}
        onSelect={onSelect}
        onTogglePin={noop}
        onRename={noop}
        onDelete={noop}
      />
    );
    await user.click(screen.getByRole('button', { name: 'My chat' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('toggles the favourite from the kebab menu', async () => {
    const onTogglePin = vi.fn();
    const { user } = renderWithProviders(
      <ConversationListItem
        {...baseProps}
        onSelect={noop}
        onTogglePin={onTogglePin}
        onRename={noop}
        onDelete={noop}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Conversation options' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Pin' }));
    expect(onTogglePin).toHaveBeenCalledTimes(1);
  });

  it('renames the conversation through the dialog', async () => {
    const onRename = vi.fn().mockResolvedValue(undefined);
    const { user } = renderWithProviders(
      <ConversationListItem
        {...baseProps}
        onSelect={noop}
        onTogglePin={noop}
        onRename={onRename}
        onDelete={noop}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Conversation options' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Rename' }));

    const input = await screen.findByLabelText('Name');
    await user.clear(input);
    await user.type(input, 'Renamed chat');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onRename).toHaveBeenCalledWith('Renamed chat');
    await waitFor(() => expect(screen.queryByText('Rename conversation')).not.toBeInTheDocument());
  });

  it('submits the rename on Enter', async () => {
    const onRename = vi.fn().mockResolvedValue(undefined);
    const { user } = renderWithProviders(
      <ConversationListItem
        {...baseProps}
        onSelect={noop}
        onTogglePin={noop}
        onRename={onRename}
        onDelete={noop}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Conversation options' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Rename' }));

    const input = await screen.findByLabelText('Name');
    await user.clear(input);
    await user.type(input, 'Via enter{Enter}');

    expect(onRename).toHaveBeenCalledWith('Via enter');
    await waitFor(() => expect(screen.queryByText('Rename conversation')).not.toBeInTheDocument());
  });

  it('cancels the rename dialog without persisting', async () => {
    const onRename = vi.fn();
    const { user } = renderWithProviders(
      <ConversationListItem
        {...baseProps}
        onSelect={noop}
        onTogglePin={noop}
        onRename={onRename}
        onDelete={noop}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Conversation options' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    await screen.findByLabelText('Name');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onRename).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('Rename conversation')).not.toBeInTheDocument());
  });

  it('shows the unpin action for a pinned conversation', async () => {
    const onTogglePin = vi.fn();
    const { user } = renderWithProviders(
      <ConversationListItem
        {...baseProps}
        isPinned
        onSelect={noop}
        onTogglePin={onTogglePin}
        onRename={noop}
        onDelete={noop}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Conversation options' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Unpin' }));
    expect(onTogglePin).toHaveBeenCalledTimes(1);
  });

  it('deletes the conversation after confirming', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const { user } = renderWithProviders(
      <ConversationListItem
        {...baseProps}
        onSelect={noop}
        onTogglePin={noop}
        onRename={noop}
        onDelete={onDelete}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Conversation options' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));

    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByText('Delete conversation')).not.toBeInTheDocument());
  });
});
