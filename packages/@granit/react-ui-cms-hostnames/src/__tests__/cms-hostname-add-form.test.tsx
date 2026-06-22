import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CmsHostnameAddForm } from '../components/cms-hostname-add-form';

import { renderCmsHostnames } from './test-utils';

const mutate = vi.fn();

vi.mock('@granit/react-cms-hostnames', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useAddSiteHostname: () => ({ mutate, isPending: false }),
  };
});

describe('CmsHostnameAddForm', () => {
  it('blocks submit and shows an error when the host is not a valid FQDN', async () => {
    const user = userEvent.setup();
    renderCmsHostnames(<CmsHostnameAddForm siteId="site-1" />);

    await user.type(screen.getByLabelText('Hostname'), 'not a host');
    await user.click(screen.getByRole('button', { name: 'Add hostname' }));

    expect(await screen.findByText('Invalid hostname format.')).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('submits the spec-validated payload for a valid FQDN', async () => {
    mutate.mockClear();
    const user = userEvent.setup();
    renderCmsHostnames(<CmsHostnameAddForm siteId="site-1" />);

    await user.type(screen.getByLabelText('Hostname'), 'www.example.com');
    await user.click(screen.getByRole('button', { name: 'Add hostname' }));

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({ host: 'www.example.com', isPrimary: false });
  });
});
