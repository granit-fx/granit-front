import { axiosResponse, createMockClient } from '@granit/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  deleteLocalizationOverride,
  listLanguages,
  setLocalizationOverride,
  updateLanguageStatus,
} from '../api/localization-admin-api';

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// listLanguages
// ---------------------------------------------------------------------------

describe('listLanguages', () => {
  it('should GET /localization/languages and return data', async () => {
    const client = createMockClient();
    const languages = [
      { cultureName: 'fr', displayName: 'Français', isEnabled: true },
      { cultureName: 'en', displayName: 'English', isEnabled: false },
    ];
    vi.mocked(client.get).mockResolvedValue(axiosResponse(languages));

    const result = await listLanguages(client, '/api');

    expect(client.get).toHaveBeenCalledWith('/api/localization/languages');
    expect(result).toEqual(languages);
  });
});

// ---------------------------------------------------------------------------
// updateLanguageStatus
// ---------------------------------------------------------------------------

describe('updateLanguageStatus', () => {
  it('should PUT to enable a language', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

    await updateLanguageStatus(client, '/api', 'en', true);

    expect(client.put).toHaveBeenCalledWith('/api/localization/languages/en', {
      isEnabled: true,
    });
  });

  it('should PUT to disable a language', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

    await updateLanguageStatus(client, '/api', 'de', false);

    expect(client.put).toHaveBeenCalledWith('/api/localization/languages/de', {
      isEnabled: false,
    });
  });

  it('should encode cultureName in the URL', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

    await updateLanguageStatus(client, '/api', 'zh-Hant', true);

    expect(client.put).toHaveBeenCalledWith('/api/localization/languages/zh-Hant', {
      isEnabled: true,
    });
  });
});

// ---------------------------------------------------------------------------
// setLocalizationOverride
// ---------------------------------------------------------------------------

describe('setLocalizationOverride', () => {
  it('should PUT the override value', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

    await setLocalizationOverride(client, '/api', 'Granit', 'fr', 'Common.Save', 'Sauvegarder');

    expect(client.put).toHaveBeenCalledWith('/api/localization/overrides/Granit/fr/Common.Save', {
      value: 'Sauvegarder',
    });
  });

  it('should encode special characters in path segments', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

    await setLocalizationOverride(client, '/api', 'My Resource', 'fr-BE', 'key/sub', 'val');

    expect(client.put).toHaveBeenCalledWith(
      '/api/localization/overrides/My%20Resource/fr-BE/key%2Fsub',
      { value: 'val' }
    );
  });
});

// ---------------------------------------------------------------------------
// deleteLocalizationOverride
// ---------------------------------------------------------------------------

describe('deleteLocalizationOverride', () => {
  it('should DELETE the override', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    await deleteLocalizationOverride(client, '/api', 'Granit', 'fr', 'Common.Save');

    expect(client.delete).toHaveBeenCalledWith('/api/localization/overrides/Granit/fr/Common.Save');
  });

  it('should encode special characters in path segments', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    await deleteLocalizationOverride(client, '/api', 'My Resource', 'fr-BE', 'key/sub');

    expect(client.delete).toHaveBeenCalledWith(
      '/api/localization/overrides/My%20Resource/fr-BE/key%2Fsub'
    );
  });
});
