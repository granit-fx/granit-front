import { screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { AppSettingsPanel } from '../components/app-settings-panel';

import { renderSettings } from './test-utils';

import type {
  AdminAppSettingResponse,
  BulkSettingEntry,
  BulkUpdateSettingsResponse,
} from '@granit/settings';

let saveResponse: BulkUpdateSettingsResponse;
const mockSave = vi.fn<
  (
    entries: readonly BulkSettingEntry[],
    opts?: { onSuccess?: (response: BulkUpdateSettingsResponse) => void }
  ) => void
>((_entries, opts) => opts?.onSuccess?.(saveResponse));

const mockSettings: AdminAppSettingResponse[] = [
  {
    key: 'audit.retention_days',
    label: 'Audit Log Retention',
    description: 'Days to retain audit logs',
    defaultValue: '365',
    value: '1095',
    valueKind: 'Int',
    allowedValues: null,
    isEncrypted: false,
  },
  {
    key: 'notifications.email_enabled',
    label: 'Email Notifications',
    description: null,
    defaultValue: 'false',
    value: 'true',
    valueKind: 'Bool',
    allowedValues: null,
    isEncrypted: false,
  },
  {
    key: 'ui.theme',
    label: 'Theme',
    description: null,
    defaultValue: 'system',
    value: 'light',
    valueKind: 'String',
    allowedValues: ['light', 'dark', 'system'],
    isEncrypted: false,
  },
  {
    key: 'integrations.stripe_secret_key',
    label: 'Stripe Secret',
    description: null,
    defaultValue: null,
    value: '***',
    valueKind: 'String',
    allowedValues: null,
    isEncrypted: true,
  },
];

vi.mock('@granit/react-settings', () => ({
  useAdminAppSettings: () => ({ data: mockSettings, isLoading: false }),
  useBulkUpdateSettings: () => ({ mutate: mockSave, isPending: false }),
  useSettings: () => ({ data: {}, isLoading: false }),
  useUpdateSetting: () => ({
    update: vi.fn(),
    updateAsync: vi.fn(),
    isPending: false,
    error: null,
  }),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  saveResponse = {
    results: mockSettings.map((s) => ({ key: s.key, outcome: 'Updated', errorCode: null })),
  };
});

describe('AppSettingsPanel', () => {
  it('should render title', () => {
    renderSettings(<AppSettingsPanel />);
    expect(screen.getByText('Application Settings')).toBeInTheDocument();
  });

  it('should render a label for each setting', async () => {
    renderSettings(<AppSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Audit Log Retention')).toBeInTheDocument();
    });
    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByText('Stripe Secret')).toBeInTheDocument();
  });

  it('should render a number input for Int kind', async () => {
    renderSettings(<AppSettingsPanel />);
    await waitFor(() => expect(screen.getByDisplayValue('1095')).toBeInTheDocument());
    expect(screen.getByDisplayValue('1095')).toHaveAttribute('type', 'number');
  });

  it('should render a switch for Bool kind', async () => {
    renderSettings(<AppSettingsPanel />);
    await waitFor(() => expect(screen.getByText('Email Notifications')).toBeInTheDocument());
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(1);
    expect(switches[0]).toHaveAttribute('data-state', 'checked');
  });

  it('should render a dropdown when allowedValues is present', async () => {
    renderSettings(<AppSettingsPanel />);
    await waitFor(() => expect(screen.getByText('Theme')).toBeInTheDocument());
    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
    expect(combobox).toHaveTextContent('light');
  });

  it('should mask encrypted fields until Change is clicked', async () => {
    const { user } = renderSettings(<AppSettingsPanel />);
    await waitFor(() => expect(screen.getByText('Stripe Secret')).toBeInTheDocument());

    const masked = screen.getByDisplayValue('••••••••');
    expect(masked).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /change/i }));
    expect(screen.queryByDisplayValue('••••••••')).not.toBeInTheDocument();
  });

  it('should send only changed entries and show success when all Updated', async () => {
    const { user } = renderSettings(<AppSettingsPanel />);
    await waitFor(() => expect(screen.getByDisplayValue('1095')).toBeInTheDocument());

    const retentionInput = screen.getByDisplayValue('1095');
    await user.clear(retentionInput);
    await user.type(retentionInput, '2000');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(mockSave).toHaveBeenCalled());
    expect(mockSave).toHaveBeenCalledWith(
      [{ key: 'audit.retention_days', value: '2000' }],
      expect.anything()
    );
    expect(toast.success).toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should surface per-row errors when outcome !== Updated', async () => {
    saveResponse = {
      results: [
        {
          key: 'audit.retention_days',
          outcome: 'ValidationFailed',
          errorCode: 'Granit:Settings:ValidationFailed',
        },
      ],
    };

    const { user } = renderSettings(<AppSettingsPanel />);
    await waitFor(() => expect(screen.getByDisplayValue('1095')).toBeInTheDocument());

    const retentionInput = screen.getByDisplayValue('1095');
    await user.clear(retentionInput);
    await user.type(retentionInput, '-1');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('should show "no changes" info when nothing is modified', async () => {
    const { user } = renderSettings(<AppSettingsPanel />);
    await waitFor(() => expect(screen.getByDisplayValue('1095')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(toast.info).toHaveBeenCalled());
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('should reset form to original values', async () => {
    const { user } = renderSettings(<AppSettingsPanel />);
    await waitFor(() => expect(screen.getByDisplayValue('1095')).toBeInTheDocument());

    const retentionInput = screen.getByDisplayValue('1095');
    await user.clear(retentionInput);
    await user.type(retentionInput, '9999');
    expect(retentionInput).toHaveValue(9999);

    await user.click(screen.getByRole('button', { name: /reset/i }));
    await waitFor(() => expect(retentionInput).toHaveValue(1095));
  });
});
