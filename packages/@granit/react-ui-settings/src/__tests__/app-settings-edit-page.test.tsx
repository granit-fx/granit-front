import { mockAppSettings } from '@granit/react-settings/testing';
import { screen } from '@testing-library/react';

import { AppSettingsEditPage } from '../app-settings-edit-page';

import { renderSettings } from './test-utils';

import type { AdminAppSettingResponse } from '@granit/settings';

const stableSettings = mockAppSettings.map((s: AdminAppSettingResponse) => ({ ...s }));

vi.mock('@granit/react-settings', () => ({
  useAdminAppSettings: () => ({ data: stableSettings, isLoading: false }),
  useBulkUpdateSettings: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSettings: () => ({ data: {}, isLoading: false }),
  useUpdateSetting: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
}));

describe('AppSettingsEditPage', () => {
  it('should render page title', () => {
    renderSettings(<AppSettingsEditPage />);
    expect(screen.getByRole('heading', { name: 'Application Settings' })).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    renderSettings(<AppSettingsEditPage />);
    expect(document.querySelector('[data-slot="app-settings-edit-page"]')).toBeInTheDocument();
  });
});
