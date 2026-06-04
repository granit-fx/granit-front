import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  createEntityView,
  deleteEntityView,
  getDefaultEntityView,
  getEntityView,
  listEntityViews,
  setEntityViewPersonalDefault,
  setEntityViewPinned,
  setEntityViewTenantDefault,
  shareEntityView,
  updateEntityView,
} from '../api/entity-views-api';

import type {
  EntityViewCreateBodyRequest,
  EntityViewResponse,
  EntityViewShareBodyRequest,
  EntityViewUpdateBodyRequest,
} from '../types/index';

const apiBase = '/api/v1';
const entityName = 'Quote';
const viewId = 'view-uuid-123';

const sampleView: EntityViewResponse = {
  id: viewId,
  entityName,
  basedOn: 'quotes-list',
  kind: 'list',
  name: 'My quotes',
  description: null,
  icon: null,
  state: { sort: 'createdAt:desc' },
  visibility: 'Personal',
  ownerId: 'user-1',
  sharedWith: null,
  isPinned: false,
  isDefault: false,
  isPersonalDefault: false,
  sortOrder: 0,
};

// ---------------------------------------------------------------------------
// listEntityViews
// ---------------------------------------------------------------------------

describe('listEntityViews', () => {
  it('GETs {basePath}/{entityName}/views', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleView]));

    const result = await listEntityViews(client, apiBase, entityName);

    expect(client.get).toHaveBeenCalledWith(`${apiBase}/${entityName}/views`, undefined);
    expect(result).toEqual([sampleView]);
  });

  it('forwards the optional AxiosRequestConfig', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));
    const config = { signal: new AbortController().signal };

    await listEntityViews(client, apiBase, entityName, config);

    expect(client.get).toHaveBeenCalledWith(`${apiBase}/${entityName}/views`, config);
  });

  it('URI-encodes the entity name', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

    await listEntityViews(client, apiBase, 'Custom/Entity');

    expect(client.get).toHaveBeenCalledWith(`${apiBase}/Custom%2FEntity/views`, undefined);
  });

  it('propagates errors from the client', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Request failed with status code 403'));

    await expect(listEntityViews(client, apiBase, entityName)).rejects.toThrow(/403/);
  });
});

// ---------------------------------------------------------------------------
// getEntityView
// ---------------------------------------------------------------------------

describe('getEntityView', () => {
  it('GETs {basePath}/{entityName}/views/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleView));

    const result = await getEntityView(client, apiBase, entityName, viewId);

    expect(client.get).toHaveBeenCalledWith(`${apiBase}/${entityName}/views/${viewId}`, undefined);
    expect(result).toEqual(sampleView);
  });

  it('URI-encodes both entity name and id', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleView));

    await getEntityView(client, apiBase, 'My/Entity', 'view/id');

    expect(client.get).toHaveBeenCalledWith(`${apiBase}/My%2FEntity/views/view%2Fid`, undefined);
  });

  it('propagates errors from the client', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Request failed with status code 404'));

    await expect(getEntityView(client, apiBase, entityName, viewId)).rejects.toThrow(/404/);
  });
});

// ---------------------------------------------------------------------------
// getDefaultEntityView
// ---------------------------------------------------------------------------

describe('getDefaultEntityView', () => {
  it('GETs {basePath}/{entityName}/views/_default and returns the view on 200', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleView));

    const result = await getDefaultEntityView(client, apiBase, entityName);

    expect(client.get).toHaveBeenCalledWith(
      `${apiBase}/${entityName}/views/_default`,
      undefined
    );
    expect(result).toEqual(sampleView);
  });

  it('returns null when the backend responds 204 No Content', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: '', status: 204, statusText: 'No Content', headers: {}, config: {} as never });

    const result = await getDefaultEntityView(client, apiBase, entityName);

    expect(result).toBeNull();
  });

  it('URI-encodes the entity name', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleView));

    await getDefaultEntityView(client, apiBase, 'Custom/Entity');

    expect(client.get).toHaveBeenCalledWith(
      `${apiBase}/Custom%2FEntity/views/_default`,
      undefined
    );
  });

  it('forwards the optional AxiosRequestConfig', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleView));
    const config = { signal: new AbortController().signal };

    await getDefaultEntityView(client, apiBase, entityName, config);

    expect(client.get).toHaveBeenCalledWith(`${apiBase}/${entityName}/views/_default`, config);
  });
});

// ---------------------------------------------------------------------------
// createEntityView
// ---------------------------------------------------------------------------

describe('createEntityView', () => {
  const createRequest: EntityViewCreateBodyRequest = {
    basedOn: 'quotes-list',
    kind: 'list',
    name: 'My quotes',
    description: null,
    icon: null,
    state: {},
  };

  it('POSTs to {basePath}/{entityName}/views with the request body', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleView));

    const result = await createEntityView(client, apiBase, entityName, createRequest);

    expect(client.post).toHaveBeenCalledWith(`${apiBase}/${entityName}/views`, createRequest);
    expect(result).toEqual(sampleView);
  });

  it('URI-encodes the entity name', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleView));

    await createEntityView(client, apiBase, 'Custom/Entity', createRequest);

    expect(client.post).toHaveBeenCalledWith(`${apiBase}/Custom%2FEntity/views`, createRequest);
  });

  it('propagates 403 when the caller lacks Entities.Views.Create', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Request failed with status code 403'));

    await expect(createEntityView(client, apiBase, entityName, createRequest)).rejects.toThrow(
      /403/
    );
  });
});

// ---------------------------------------------------------------------------
// updateEntityView
// ---------------------------------------------------------------------------

describe('updateEntityView', () => {
  const updateRequest: EntityViewUpdateBodyRequest = {
    name: 'Updated name',
    description: 'Updated description',
    icon: 'star',
    state: { sort: 'name:asc' },
  };

  it('PUTs to {basePath}/{entityName}/views/{id} with the request body', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(sampleView));

    const result = await updateEntityView(client, apiBase, entityName, viewId, updateRequest);

    expect(client.put).toHaveBeenCalledWith(
      `${apiBase}/${entityName}/views/${viewId}`,
      updateRequest
    );
    expect(result).toEqual(sampleView);
  });

  it('URI-encodes entity name and id', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(sampleView));

    await updateEntityView(client, apiBase, 'My/Entity', 'view/id', updateRequest);

    expect(client.put).toHaveBeenCalledWith(
      `${apiBase}/My%2FEntity/views/view%2Fid`,
      updateRequest
    );
  });

  it('propagates 404 when the view does not exist', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockRejectedValue(new Error('Request failed with status code 404'));

    await expect(
      updateEntityView(client, apiBase, entityName, viewId, updateRequest)
    ).rejects.toThrow(/404/);
  });
});

// ---------------------------------------------------------------------------
// deleteEntityView
// ---------------------------------------------------------------------------

describe('deleteEntityView', () => {
  it('DELETEs {basePath}/{entityName}/views/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    await deleteEntityView(client, apiBase, entityName, viewId);

    expect(client.delete).toHaveBeenCalledWith(`${apiBase}/${entityName}/views/${viewId}`);
  });

  it('URI-encodes entity name and id', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    await deleteEntityView(client, apiBase, 'My/Entity', 'view/id');

    expect(client.delete).toHaveBeenCalledWith(`${apiBase}/My%2FEntity/views/view%2Fid`);
  });

  it('propagates 403 when the caller lacks Entities.Views.Delete', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockRejectedValue(new Error('Request failed with status code 403'));

    await expect(deleteEntityView(client, apiBase, entityName, viewId)).rejects.toThrow(/403/);
  });
});

// ---------------------------------------------------------------------------
// setEntityViewPinned
// ---------------------------------------------------------------------------

describe('setEntityViewPinned', () => {
  it('POSTs {value: true} to {basePath}/{entityName}/views/{id}/pin', async () => {
    const client = createMockClient();
    const pinned = { ...sampleView, isPinned: true };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(pinned));

    const result = await setEntityViewPinned(client, apiBase, entityName, viewId, true);

    expect(client.post).toHaveBeenCalledWith(
      `${apiBase}/${entityName}/views/${viewId}/pin`,
      { value: true }
    );
    expect(result).toEqual(pinned);
  });

  it('POSTs {value: false} to unpin', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleView));

    await setEntityViewPinned(client, apiBase, entityName, viewId, false);

    expect(client.post).toHaveBeenCalledWith(
      `${apiBase}/${entityName}/views/${viewId}/pin`,
      { value: false }
    );
  });

  it('URI-encodes entity name and id', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleView));

    await setEntityViewPinned(client, apiBase, 'My/Entity', 'view/id', true);

    expect(client.post).toHaveBeenCalledWith(
      `${apiBase}/My%2FEntity/views/view%2Fid/pin`,
      { value: true }
    );
  });

  it('propagates 403 when the caller lacks Entities.Views.Manage', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Request failed with status code 403'));

    await expect(setEntityViewPinned(client, apiBase, entityName, viewId, true)).rejects.toThrow(
      /403/
    );
  });
});

// ---------------------------------------------------------------------------
// setEntityViewTenantDefault
// ---------------------------------------------------------------------------

describe('setEntityViewTenantDefault', () => {
  it('POSTs {value: true} to {basePath}/{entityName}/views/{id}/set-default', async () => {
    const client = createMockClient();
    const defaultView = { ...sampleView, isDefault: true };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(defaultView));

    const result = await setEntityViewTenantDefault(client, apiBase, entityName, viewId, true);

    expect(client.post).toHaveBeenCalledWith(
      `${apiBase}/${entityName}/views/${viewId}/set-default`,
      { value: true }
    );
    expect(result).toEqual(defaultView);
  });

  it('POSTs {value: false} to clear the tenant default', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleView));

    await setEntityViewTenantDefault(client, apiBase, entityName, viewId, false);

    expect(client.post).toHaveBeenCalledWith(
      `${apiBase}/${entityName}/views/${viewId}/set-default`,
      { value: false }
    );
  });

  it('URI-encodes entity name and id', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleView));

    await setEntityViewTenantDefault(client, apiBase, 'My/Entity', 'view/id', true);

    expect(client.post).toHaveBeenCalledWith(
      `${apiBase}/My%2FEntity/views/view%2Fid/set-default`,
      { value: true }
    );
  });

  it('propagates 403 when the caller lacks Entities.Views.Manage', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Request failed with status code 403'));

    await expect(
      setEntityViewTenantDefault(client, apiBase, entityName, viewId, true)
    ).rejects.toThrow(/403/);
  });
});

// ---------------------------------------------------------------------------
// setEntityViewPersonalDefault
// ---------------------------------------------------------------------------

describe('setEntityViewPersonalDefault', () => {
  it('POSTs {value: true} to {basePath}/{entityName}/views/{id}/star', async () => {
    const client = createMockClient();
    const starred = { ...sampleView, isPersonalDefault: true };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(starred));

    const result = await setEntityViewPersonalDefault(client, apiBase, entityName, viewId, true);

    expect(client.post).toHaveBeenCalledWith(
      `${apiBase}/${entityName}/views/${viewId}/star`,
      { value: true }
    );
    expect(result).toEqual(starred);
  });

  it('POSTs {value: false} to clear the personal default', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleView));

    await setEntityViewPersonalDefault(client, apiBase, entityName, viewId, false);

    expect(client.post).toHaveBeenCalledWith(
      `${apiBase}/${entityName}/views/${viewId}/star`,
      { value: false }
    );
  });

  it('URI-encodes entity name and id', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleView));

    await setEntityViewPersonalDefault(client, apiBase, 'My/Entity', 'view/id', true);

    expect(client.post).toHaveBeenCalledWith(
      `${apiBase}/My%2FEntity/views/view%2Fid/star`,
      { value: true }
    );
  });

  it('propagates errors from the client', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Request failed with status code 404'));

    await expect(
      setEntityViewPersonalDefault(client, apiBase, entityName, viewId, true)
    ).rejects.toThrow(/404/);
  });
});

// ---------------------------------------------------------------------------
// shareEntityView
// ---------------------------------------------------------------------------

describe('shareEntityView', () => {
  const shareRequest: EntityViewShareBodyRequest = {
    roles: ['sales-rep'],
    users: ['user-2', 'user-3'],
  };

  it('POSTs to {basePath}/{entityName}/views/{id}/share with the audience body', async () => {
    const client = createMockClient();
    const shared = { ...sampleView, visibility: 'Shared' as const, sharedWith: { roles: ['sales-rep'], users: ['user-2', 'user-3'] } };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(shared));

    const result = await shareEntityView(client, apiBase, entityName, viewId, shareRequest);

    expect(client.post).toHaveBeenCalledWith(
      `${apiBase}/${entityName}/views/${viewId}/share`,
      shareRequest
    );
    expect(result).toEqual(shared);
  });

  it('accepts an empty audience (share with nobody beyond owner)', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleView));
    const emptyAudience: EntityViewShareBodyRequest = { roles: [], users: [] };

    await shareEntityView(client, apiBase, entityName, viewId, emptyAudience);

    expect(client.post).toHaveBeenCalledWith(
      `${apiBase}/${entityName}/views/${viewId}/share`,
      emptyAudience
    );
  });

  it('URI-encodes entity name and id', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleView));

    await shareEntityView(client, apiBase, 'My/Entity', 'view/id', shareRequest);

    expect(client.post).toHaveBeenCalledWith(
      `${apiBase}/My%2FEntity/views/view%2Fid/share`,
      shareRequest
    );
  });

  it('propagates 403 when the caller lacks Entities.Views.Share', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Request failed with status code 403'));

    await expect(
      shareEntityView(client, apiBase, entityName, viewId, shareRequest)
    ).rejects.toThrow(/403/);
  });
});
