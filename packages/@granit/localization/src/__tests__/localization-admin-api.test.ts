import { axiosResponse, createMockClient } from '@granit/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { deleteLocalizationOverride, setLocalizationOverride } from '../api/localization-admin-api';

const BASE = '/api/v1/localization';

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// setLocalizationOverride
// ---------------------------------------------------------------------------

describe('setLocalizationOverride', () => {
  it('should PUT the override value to {basePath}/overrides/{resource}/{culture}/{key}', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

    await setLocalizationOverride(client, BASE, 'Granit', 'fr', 'Common.Save', 'Sauvegarder');

    expect(client.put).toHaveBeenCalledWith(`${BASE}/overrides/Granit/fr/Common.Save`, {
      value: 'Sauvegarder',
    });
  });

  it('should encode special characters in path segments', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

    await setLocalizationOverride(client, BASE, 'My Resource', 'fr-BE', 'key/sub', 'val');

    expect(client.put).toHaveBeenCalledWith(`${BASE}/overrides/My%20Resource/fr-BE/key%2Fsub`, {
      value: 'val',
    });
  });
});

// ---------------------------------------------------------------------------
// deleteLocalizationOverride
// ---------------------------------------------------------------------------

describe('deleteLocalizationOverride', () => {
  it('should DELETE the override', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    await deleteLocalizationOverride(client, BASE, 'Granit', 'fr', 'Common.Save');

    expect(client.delete).toHaveBeenCalledWith(`${BASE}/overrides/Granit/fr/Common.Save`);
  });

  it('should encode special characters in path segments', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    await deleteLocalizationOverride(client, BASE, 'My Resource', 'fr-BE', 'key/sub');

    expect(client.delete).toHaveBeenCalledWith(`${BASE}/overrides/My%20Resource/fr-BE/key%2Fsub`);
  });
});
