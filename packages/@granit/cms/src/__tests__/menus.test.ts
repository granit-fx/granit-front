import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { resolveMenu } from '../api/menus';

import type { ResolvedMenu } from '../types/index';

const basePath = 'https://cms.example.com';

const sampleMenu: ResolvedMenu = {
  key: 'main',
  title: 'Navigation principale',
  culture: 'fr',
  items: [
    {
      label: 'Accueil',
      kind: 'Page',
      href: '/',
      children: [],
    },
    {
      label: 'Contact',
      kind: 'ExternalUrl',
      href: 'https://contact.example.com',
      children: [],
    },
  ],
};

describe('resolveMenu', () => {
  it('returns the resolved menu on 200', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleMenu));

    const result = await resolveMenu(client, basePath, {
      siteId: 'site-1',
      key: 'main',
      culture: 'fr',
    });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/api/cms/menus/resolve`, {
      params: { siteId: 'site-1', key: 'main', culture: 'fr' },
    });
    expect(result).toEqual(sampleMenu);
  });

  it('returns null on 404', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue({ response: { status: 404 } });

    const result = await resolveMenu(client, basePath, {
      siteId: 'site-1',
      key: 'missing',
      culture: 'fr',
    });

    expect(result).toBeNull();
  });
});
